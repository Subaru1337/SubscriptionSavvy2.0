import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const bulkSchema = z.object({
  action: z.enum(["cancel", "pause", "delete"]),
  ids: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { action, ids } = parsed.data;

  // Validate ownership
  const subs = await prisma.subscription.findMany({
    where: { id: { in: ids } },
    select: { id: true, userId: true, status: true, cancelledAt: true },
  });

  if (subs.length !== ids.length) {
    return NextResponse.json({ error: "One or more subscriptions not found" }, { status: 404 });
  }

  if (subs.some((s) => s.userId !== user.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let affected = 0;

  if (action === "delete") {
    const res = await prisma.subscription.deleteMany({
      where: { id: { in: ids } },
    });
    affected = res.count;
  } else if (action === "pause") {
    const res = await prisma.subscription.updateMany({
      where: { id: { in: ids } },
      data: { status: "paused" },
    });
    affected = res.count;
  } else if (action === "cancel") {
    // For cancel, we only update cancelledAt if it wasn't already cancelled
    const toCancelIds = subs.filter(s => s.status !== "cancelled").map(s => s.id);
    if (toCancelIds.length > 0) {
      const res = await prisma.subscription.updateMany({
        where: { id: { in: toCancelIds } },
        data: { status: "cancelled", cancelledAt: new Date() },
      });
      affected = res.count;
    }
  }

  return NextResponse.json({ affected });
}
