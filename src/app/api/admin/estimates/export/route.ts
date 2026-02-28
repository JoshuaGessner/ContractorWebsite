import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { estimatesToCsv } from "@/lib/estimates-csv";
import { prisma } from "@/lib/prisma";

const exportSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = exportSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid estimate selection." }, { status: 400 });
  }

  const estimates = await prisma.estimateRequest.findMany({
    where: { id: { in: parsed.data.ids } },
    include: { mediaAssets: true },
    orderBy: { createdAt: "desc" },
  });

  const csv = estimatesToCsv(estimates);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="estimates-export-${Date.now()}.csv"`,
    },
  });
}
