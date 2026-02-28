import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z
  .object({
    id: z.string().trim().min(1),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine((data) => data.status !== undefined || data.isFeatured !== undefined, {
    message: "At least one testimonial field must be provided.",
  });

const deleteSchema = z.object({
  id: z.string().trim().min(1),
});

export async function PATCH(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid testimonial update." }, { status: 400 });
  }

  const testimonial = await prisma.testimonial.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      isFeatured: parsed.data.isFeatured,
      approvedAt:
        parsed.data.status === undefined
          ? undefined
          : parsed.data.status === "APPROVED"
            ? new Date()
            : null,
    },
  });

  return NextResponse.json({
    testimonial: {
      ...testimonial,
      createdAt: testimonial.createdAt.toISOString(),
      updatedAt: testimonial.updatedAt.toISOString(),
      approvedAt: testimonial.approvedAt?.toISOString() ?? null,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = deleteSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid testimonial id." }, { status: 400 });
  }

  await prisma.testimonial.delete({
    where: { id: parsed.data.id },
  });

  return NextResponse.json({ message: "Testimonial deleted." });
}
