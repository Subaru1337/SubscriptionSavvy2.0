import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthUser, clearAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Require password confirmation for destructive action
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Password confirmation required" },
      { status: 400 }
    );
  }

  const { password } = body as { password?: string };
  if (!password) {
    return NextResponse.json(
      { error: "Password is required to delete your account" },
      { status: 400 }
    );
  }

  // Verify password against stored hash
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 403 }
    );
  }

  // Password confirmed — proceed with account deletion
  await prisma.user.delete({ where: { id: authUser.userId } });

  const response = NextResponse.json({ success: true });
  response.cookies.set(clearAuthCookie());
  return response;
}
