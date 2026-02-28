import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { estimatesToCsv } from "@/lib/estimates-csv";
import { readStoredMediaBuffer } from "@/lib/media-storage";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const deleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "video/mp4") return "mp4";
  if (mimeType === "video/webm") return "webm";
  if (mimeType === "video/quicktime") return "mov";
  return "bin";
}

async function resolveMediaBuffer(storageKey: string, publicUrl: string | null) {
  return readStoredMediaBuffer({ storageKey, publicUrl });
}

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = deleteSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid estimate selection." }, { status: 400 });
  }

  const estimates = await prisma.estimateRequest.findMany({
    where: { id: { in: parsed.data.ids } },
    include: { mediaAssets: true },
    orderBy: { createdAt: "desc" },
  });

  if (!estimates.length) {
    return NextResponse.json({ message: "No matching estimates found." }, { status: 404 });
  }

  const csv = estimatesToCsv(estimates);
  const backupTimestamp = Date.now();
  const zip = new JSZip();
  zip.file("estimates.csv", csv);

  const missingFiles: { estimateId: string; mediaId: string; reason: string }[] = [];

  for (const estimate of estimates) {
    for (const media of estimate.mediaAssets) {
      const extension = extensionFromMimeType(media.mimeType);
      const zipPath = `media/${estimate.id}/${sanitizeFileName(media.id)}.${extension}`;

      try {
        const mediaBuffer = await resolveMediaBuffer(media.storageKey, media.publicUrl);
        zip.file(zipPath, mediaBuffer);
      } catch (error) {
        missingFiles.push({
          estimateId: estimate.id,
          mediaId: media.id,
          reason: error instanceof Error ? error.message : "Unknown media backup error.",
        });
      }
    }
  }

  zip.file(
    "backup-summary.json",
    JSON.stringify(
      {
        exportedAt: new Date(backupTimestamp).toISOString(),
        estimateCount: estimates.length,
        mediaCount: estimates.reduce((total, estimate) => total + estimate.mediaAssets.length, 0),
        missingFiles,
      },
      null,
      2,
    ),
  );

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
  const zipBytes = new Uint8Array(zipBuffer);

  await prisma.estimateRequest.deleteMany({
    where: { id: { in: estimates.map((estimate) => estimate.id) } },
  });

  return new NextResponse(zipBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="deleted-estimates-backup-${backupTimestamp}.zip"`,
    },
  });
}
