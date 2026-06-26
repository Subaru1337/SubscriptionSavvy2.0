// SERVER ONLY — do not import this file from client components
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { CURRENCY_SYMBOLS } from "@/lib/currency";

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, subscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { email: true, baseCurrency: true },
    }),
    prisma.subscription.findMany({
      where: { userId: authUser.userId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Group by category
  const grouped: Record<string, typeof subscriptions> = {};
  for (const sub of subscriptions) {
    if (!grouped[sub.category]) grouped[sub.category] = [];
    grouped[sub.category].push(sub);
  }

  // Build PDF as HTML-like text using jsPDF
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = 210;
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 115, 119); // --primary
  doc.text("SubscriptionSavvy", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 101, 96); // --text-secondary
  doc.text(`Export for: ${user.email}`, margin, y);
  y += 5;
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")}`, margin, y);
  y += 5;
  doc.text(`Total subscriptions: ${subscriptions.length}`, margin, y);
  y += 10;

  // Divider
  doc.setDrawColor(232, 226, 217);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Categories
  for (const [category, subs] of Object.entries(grouped)) {
    // Check page overflow
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    // Category header
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 115, 119);
    doc.text(category, margin, y);
    y += 6;

    for (const sub of subs) {
      if (y > 268) {
        doc.addPage();
        y = margin;
      }

      const symbol = CURRENCY_SYMBOLS[sub.currency] || sub.currency;
      const cost = `${symbol}${Number(sub.cost).toLocaleString()}`;
      const nextPmt = format(new Date(sub.nextPayment), "dd MMM yyyy");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 26, 26);
      doc.text(sub.name, margin + 4, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 101, 96);
      const details = `${cost} · ${sub.billingCycle} · Next: ${nextPmt} · ${sub.status}`;
      doc.text(details, margin + 4, y + 4.5);
      y += 10;
    }

    y += 4;
  }

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="subscriptions-${format(new Date(), "yyyy-MM-dd")}.pdf"`,
    },
  });
}
