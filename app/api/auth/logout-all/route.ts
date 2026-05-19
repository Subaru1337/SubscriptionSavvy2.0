import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, clearAuthCookie } from "@/lib/auth";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.userId },
    data: { lastLogoutAt: new Date() },
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set(clearAuthCookie());
  return response;
}
