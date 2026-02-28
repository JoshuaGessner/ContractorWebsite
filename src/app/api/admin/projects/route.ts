import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const projectMediaSchema = z.object({
  mediaType: z.string().trim().min(3).max(120),
  mediaUrl: z.string().trim().min(1),
  storageKey: z.string().trim().min(1),
  fileSize: z.number().int().positive(),
});

const createProjectSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(4000),
  mediaAssets: z.array(projectMediaSchema).min(1).max(24),
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
      mediaType: parsed.data.mediaAssets[0]?.mediaType ?? "application/octet-stream",
      mediaUrl: parsed.data.mediaAssets[0]?.mediaUrl ?? "",
      storageKey: parsed.data.mediaAssets[0]?.storageKey ?? "",
      fileSize: parsed.data.mediaAssets[0]?.fileSize ?? 0,
      isPublished: parsed.data.isPublished ?? true,
      mediaAssets: {
        create: parsed.data.mediaAssets.map((asset, index) => ({
          mediaType: asset.mediaType,
          mediaUrl: asset.mediaUrl,
          storageKey: asset.storageKey,
          fileSize: asset.fileSize,
          sortOrder: index,
        })),
      },
    },
    include: {
      mediaAssets: {
        orderBy: { sortOrder: "asc" },
      },
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
