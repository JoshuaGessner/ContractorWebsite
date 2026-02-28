import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { uploadMediaBuffer } from "@/lib/media-storage";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

function resolveLimit(fileType: string) {
  if (fileType.startsWith("image/")) {
    return MAX_IMAGE_BYTES;
  }

  if (fileType.startsWith("video/")) {
    return MAX_VIDEO_BYTES;
  }

  return 0;
}

export async function POST(request: NextRequest) {
  const scopeParam = request.nextUrl.searchParams.get("scope");
  const scope = scopeParam === "portfolio" ? "portfolio" : "estimate";

  if (scope === "portfolio") {
    const admin = await getAuthenticatedAdmin();

    if (!admin) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
  }

  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`upload:${scope}:${ip}`, 30, 10 * 60 * 1000);

  if (!rate.allowed) {
    return NextResponse.json({ message: "Too many upload requests. Try again soon." }, { status: 429 });
  }

  const formData = await request.formData();
  const fileEntry = formData.get("file");

  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ message: "No file received." }, { status: 400 });
  }

  const fileType = fileEntry.type;
  const fileSize = fileEntry.size;
  const limit = resolveLimit(fileType);

  if (!limit) {
    return NextResponse.json({ message: "Only image and video files are allowed." }, { status: 400 });
  }

  if (fileSize > limit) {
    return NextResponse.json(
      {
        message: `File is too large. Max allowed for this type is ${Math.floor(limit / (1024 * 1024))}MB.`,
      },
      { status: 400 },
    );
  }

  const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
  const uploaded = await uploadMediaBuffer({
    fileBuffer,
    fileName: fileEntry.name || "upload.bin",
    fileType,
    scope,
  });

  return NextResponse.json({
    storageKey: uploaded.storageKey,
    publicUrl: uploaded.publicUrl,
    mimeType: fileType,
    fileSize,
  });
}
