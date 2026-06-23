import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";
import { z } from "zod";

const rowSchema = z.object({
  name: z.string().min(1).max(100),
  cost: z.string().transform((v) => parseFloat(v)),
  billingCycle: z.string(),
  nextPayment: z.string(),
  category: z.string().optional().default("Other"),
  currency: z.string().optional().default("INR"),
  notes: z.string().max(500).optional().default(""),
});

// Strict schema for confirmed import rows (PUT handler)
const importRowSchema = z.object({
  name: z.string().min(1).max(100),
  cost: z.number().positive().finite(),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"]).default("INR"),
  category: z.string().min(1).max(50).default("Other"),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  nextPayment: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  notes: z.string().max(500).optional().nullable(),
});

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let text: string;
  try {
    const formData = (await request.formData()) as any;
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    // Enforce file size limit to prevent memory exhaustion
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 1MB allowed." }, { status: 400 });
    }
    text = await file.text();
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 400 });
  }

  let records: Record<string, string>[];
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  } catch {
    return NextResponse.json({ error: "Failed to parse CSV" }, { status: 400 });
  }

  if (records.length > 100) {
    return NextResponse.json({ error: "Maximum 100 rows per import" }, { status: 400 });
  }

  // Get existing subscription names for duplicate detection
  const existing = await prisma.subscription.findMany({
    where: { userId: authUser.userId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));

  const imported: typeof records = [];
  const duplicates: string[] = [];
  const errors: { row: number; error: string }[] = [];
  const preview: Record<string, unknown>[] = [];

  records.forEach((record, i) => {
    const parsed = rowSchema.safeParse({
      name: record.Name || record.name,
      cost: record.Cost || record.cost,
      billingCycle: record["Billing Cycle"] || record.billingCycle || "monthly",
      nextPayment: record["Next Payment"] || record.nextPayment,
      category: record.Category || record.category || "Other",
      currency: record.Currency || record.currency || "INR",
      notes: record.Notes || record.notes || "",
    });

    if (!parsed.success) {
      errors.push({ row: i + 1, error: parsed.error.errors[0].message });
      return;
    }

    const isDuplicate = existingNames.has(parsed.data.name.toLowerCase());
    preview.push({ ...parsed.data, isDuplicate, rowIndex: i });

    if (isDuplicate) {
      duplicates.push(parsed.data.name);
    } else {
      imported.push(record);
    }
  });

  return NextResponse.json({
    preview,
    duplicates,
    errors,
    total: records.length,
  });
}

export async function PUT(request: NextRequest) {
  // Final import confirmation
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { rows: Record<string, unknown>[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { rows } = body;
  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
  }

  let importedCount = 0;
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, unknown>;

    // Validate each row with strict schema before inserting
    const parsed = importRowSchema.safeParse(row);
    if (!parsed.success) {
      errors.push({ row: i + 1, error: parsed.error.errors[0]?.message || "Invalid data" });
      continue;
    }

    const validRow = parsed.data;
    try {
      await prisma.subscription.create({
        data: {
          userId: authUser.userId,
          name: validRow.name,
          cost: validRow.cost,
          currency: validRow.currency,
          category: validRow.category,
          billingCycle: validRow.billingCycle,
          nextPayment: new Date(validRow.nextPayment),
          notes: validRow.notes ?? null,
          status: "active",
        },
      });
      importedCount++;
    } catch (err) {
      errors.push({ row: i + 1, error: "Failed to import row" });
    }
  }

  return NextResponse.json({
    imported: importedCount,
    skipped: rows.length - importedCount,
    errors,
  });
}
