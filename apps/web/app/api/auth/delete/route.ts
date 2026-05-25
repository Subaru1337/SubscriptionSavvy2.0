import { NextResponse } from "next/server";
import { getAuthUser, clearAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: authUser.userId } });

  const response = NextResponse.json({ success: true });
  response.cookies.set(clearAuthCookie());
  return response;
}
