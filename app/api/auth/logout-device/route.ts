import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, clearAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId } = body as { sessionId: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // Delete the specific session
  await prisma.sessionLog.deleteMany({
    where: {
      id: sessionId,
      userId: authUser.userId // Ensure ownership
    }
  });

  const response = NextResponse.json({ success: true });

  // If the user deleted their own current session, clear their cookie
  if (sessionId === authUser.sessionId) {
    response.cookies.set(clearAuthCookie());
  }

  return response;
}
