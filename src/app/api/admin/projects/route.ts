import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const createProjectSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(4000),
  mediaType: z.string().trim().min(3).max(120),
  mediaUrl: z.string().trim().min(1),
  storageKey: z.string().trim().min(1),
  fileSize: z.number().int().positive(),
  isPublished: z.boolean().optional(),
});

const deleteProjectSchema = z.object({
  id: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = createProjectSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid project data." }, { status: 400 });
  }

  const project = await prisma.portfolioProject.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      mediaType: parsed.data.mediaType,
      mediaUrl: parsed.data.mediaUrl,
      storageKey: parsed.data.storageKey,
      fileSize: parsed.data.fileSize,
      isPublished: parsed.data.isPublished ?? true,
    },
  });

  return NextResponse.json({ project });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = deleteProjectSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid project id." }, { status: 400 });
  }

  await prisma.portfolioProject.delete({
    where: { id: parsed.data.id },
  });

  return NextResponse.json({ message: "Project deleted." });
}
