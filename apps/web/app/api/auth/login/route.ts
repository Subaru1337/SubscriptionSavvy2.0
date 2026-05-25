import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signJWT, createAuthCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Always compare to avoid timing attacks
  const dummyHash = "$2b$10$invalidhashfortimingnnnnnnnnnnnnnnnnnnnnnnn";
  const isValid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, dummyHash).then(() => false);

  if (!user || !isValid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  const newSession = await prisma.sessionLog.create({
    data: {
      userId: user.id,
      ipAddress: ip,
      userAgent: userAgent,
    }
  });

  // Keep only 5 most recent sessions
  const allSessions = await prisma.sessionLog.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: 'desc' },
    select: { id: true },
  });
  if (allSessions.length > 5) {
    const toDelete = allSessions.slice(5).map((s: any) => s.id);
    await prisma.sessionLog.deleteMany({ where: { id: { in: toDelete } } });
  }

  const token = await signJWT({ 
    userId: user.id, 
    email: user.email,
    sessionId: newSession.id
  });
  const cookieConfig = createAuthCookie(token);

  const response = NextResponse.json({
    user: { id: user.id, email: user.email },
    token: token,
  });
  response.cookies.set(cookieConfig);
  return response;
}
