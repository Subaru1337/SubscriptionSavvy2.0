import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, verifyJWT } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // Invalidate the session in the database before clearing the cookie
  if (token) {
    try {
      const payload = await verifyJWT(token);
      if (payload.sessionId) {
        await prisma.sessionLog.deleteMany({
          where: { id: payload.sessionId, userId: payload.userId },
        });
      }
    } catch {
      // Token is invalid/expired — just clear the cookie
    }
  }

  cookieStore.delete(COOKIE_NAME);

  return NextResponse.json({ success: true });
}
