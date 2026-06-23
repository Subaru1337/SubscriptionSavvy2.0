import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signJWT, createAuthCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Rate limiting is handled by middleware (lib/rate-limit.ts)

export async function POST(request: NextRequest) {

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  // Check if email already exists — use generic error to prevent user enumeration
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Unable to create account. Please try a different email or log in." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true },
  });

  const token = await signJWT({ userId: user.id, email: user.email });
  const cookieConfig = createAuthCookie(token);

  // Only include raw token for mobile clients; web uses httpOnly cookie only
  const isMobile = request.headers.get("x-client-type") === "mobile";
  const responseBody: Record<string, unknown> = { user };
  if (isMobile) {
    responseBody.token = token;
  }

  const response = NextResponse.json(responseBody, { status: 201 });
  response.cookies.set(cookieConfig);
  return response;
}
