import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { readStoredMediaBuffer } from "@/lib/media-storage";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function sanitizeDownloadName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { mediaId } = await params;

  const media = await prisma.mediaAsset.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    return NextResponse.json({ message: "Media not found." }, { status: 404 });
  }

  const fileBuffer = await readStoredMediaBuffer({
    storageKey: media.storageKey,
    publicUrl: media.publicUrl,
  });

  const fileNameFromStorage = path.basename(media.storageKey);
  const safeFileName = sanitizeDownloadName(fileNameFromStorage || `${media.id}.bin`);
  const download = request.nextUrl.searchParams.get("download") === "1";

  const headers: Record<string, string> = {
    "Content-Type": media.mimeType || "application/octet-stream",
    "Cache-Control": "private, no-store",
  };

  if (download) {
    headers["Content-Disposition"] = `attachment; filename="${safeFileName}"`;
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers,
  });
}
