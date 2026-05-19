import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const overdueCount = await prisma.subscription.count({
    where: {
      userId: authUser.userId,
      status: 'active',
      nextPayment: { lte: new Date() },
    },
  });

  return NextResponse.json({ overdueCount });
}
