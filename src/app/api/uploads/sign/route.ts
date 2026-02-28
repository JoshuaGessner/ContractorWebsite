import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { signUploadSchema } from "@/lib/validation";

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

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
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

  const env = getServerEnv();

  const s3 = new S3Client({
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: Boolean(env.S3_ENDPOINT),
  });

  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`upload-sign:${scope}:${ip}`, 30, 10 * 60 * 1000);

  if (!rate.allowed) {
    return NextResponse.json({ message: "Too many upload requests. Try again soon." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = signUploadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid upload metadata." }, { status: 400 });
  }

  const { fileName, fileSize, fileType } = parsed.data;
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

  const safeName = cleanFileName(fileName);
  const keyPrefix = scope === "portfolio" ? "portfolio-public" : "estimate-private";
  const key = `${keyPrefix}/${new Date().getFullYear()}/${randomUUID()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
  const publicUrl = scope === "portfolio" && env.S3_PUBLIC_BASE_URL ? `${env.S3_PUBLIC_BASE_URL}/${key}` : null;

  return NextResponse.json({
    uploadUrl,
    storageKey: key,
    publicUrl,
  });
}
