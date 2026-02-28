import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

type S3Config = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicBaseUrl?: string;
};

function resolveLimit(fileType: string) {
  if (fileType.startsWith("image/")) {
    return MAX_IMAGE_BYTES;
  }

  if (fileType.startsWith("video/")) {
    return MAX_VIDEO_BYTES;
  }

  return 0;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
}

function isConfigured(value: string | undefined) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return !normalized.includes("your-") && !normalized.includes("change-me");
}

function getS3Config(): S3Config | null {
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.S3_ENDPOINT;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;

  if (!isConfigured(region) || !isConfigured(bucket) || !isConfigured(accessKeyId) || !isConfigured(secretAccessKey)) {
    return null;
  }

  return {
    region: region as string,
    bucket: bucket as string,
    accessKeyId: accessKeyId as string,
    secretAccessKey: secretAccessKey as string,
    endpoint: isConfigured(endpoint) ? endpoint : undefined,
    publicBaseUrl: isConfigured(publicBaseUrl) ? publicBaseUrl : undefined,
  };
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`upload:${ip}`, 30, 10 * 60 * 1000);

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

  const safeName = sanitizeFileName(fileEntry.name || "upload.bin");
  const storageKey = `estimate-uploads/${new Date().getFullYear()}/${randomUUID()}-${safeName}`;
  const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
  const s3Config = getS3Config();

  if (s3Config) {
    const s3 = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
      endpoint: s3Config.endpoint,
      forcePathStyle: Boolean(s3Config.endpoint),
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: storageKey,
        ContentType: fileType,
        Body: fileBuffer,
      }),
    );

    return NextResponse.json({
      storageKey,
      publicUrl: s3Config.publicBaseUrl ? `${s3Config.publicBaseUrl}/${storageKey}` : null,
      mimeType: fileType,
      fileSize,
    });
  }

  const localDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(localDir, { recursive: true });
  const localFileName = `${Date.now()}-${randomUUID()}-${safeName}`;
  const localPath = path.join(localDir, localFileName);

  await writeFile(localPath, fileBuffer);

  return NextResponse.json({
    storageKey: `local/${localFileName}`,
    publicUrl: `/uploads/${localFileName}`,
    mimeType: fileType,
    fileSize,
  });
}
