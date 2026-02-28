import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type S3Config = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicBaseUrl?: string;
};

type UploadScope = "estimate" | "portfolio";

function isConfigured(value: string | undefined) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return !normalized.includes("your-") && !normalized.includes("change-me");
}

export function getS3Config(): S3Config | null {
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

function createS3Client(config: S3Config) {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: Boolean(config.endpoint),
  });
}

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
}

function storagePrefix(scope: UploadScope) {
  return scope === "portfolio" ? "portfolio-public" : "estimate-private";
}

function isPublicScope(scope: UploadScope) {
  return scope === "portfolio";
}

export async function uploadMediaBuffer({
  fileBuffer,
  fileName,
  fileType,
  scope,
}: {
  fileBuffer: Buffer;
  fileName: string;
  fileType: string;
  scope: UploadScope;
}) {
  const safeName = sanitizeFileName(fileName || "upload.bin");
  const keyPrefix = storagePrefix(scope);
  const storageKey = `${keyPrefix}/${new Date().getFullYear()}/${randomUUID()}-${safeName}`;
  const s3Config = getS3Config();

  if (s3Config) {
    const s3 = createS3Client(s3Config);

    await s3.send(
      new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: storageKey,
        ContentType: fileType,
        Body: fileBuffer,
      }),
    );

    return {
      storageKey,
      publicUrl: isPublicScope(scope) && s3Config.publicBaseUrl ? `${s3Config.publicBaseUrl}/${storageKey}` : null,
    };
  }

  if (isPublicScope(scope)) {
    const localDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(localDir, { recursive: true });
    const localFileName = `${Date.now()}-${randomUUID()}-${safeName}`;
    const localPath = path.join(localDir, localFileName);
    await writeFile(localPath, fileBuffer);

    return {
      storageKey: `local-public/${localFileName}`,
      publicUrl: `/uploads/${localFileName}`,
    };
  }

  const privateDir = path.join(process.cwd(), "private", "uploads");
  await mkdir(privateDir, { recursive: true });
  const privateFileName = `${Date.now()}-${randomUUID()}-${safeName}`;
  const privatePath = path.join(privateDir, privateFileName);
  await writeFile(privatePath, fileBuffer);

  return {
    storageKey: `local-private/${privateFileName}`,
    publicUrl: null,
  };
}

export async function readStoredMediaBuffer({
  storageKey,
  publicUrl,
}: {
  storageKey: string;
  publicUrl?: string | null;
}) {
  if (storageKey.startsWith("local-private/")) {
    const localFileName = storageKey.slice("local-private/".length);
    const localPath = path.join(process.cwd(), "private", "uploads", localFileName);
    return readFile(localPath);
  }

  if (storageKey.startsWith("local-public/")) {
    const localFileName = storageKey.slice("local-public/".length);
    const localPath = path.join(process.cwd(), "public", "uploads", localFileName);
    return readFile(localPath);
  }

  if (storageKey.startsWith("local/")) {
    const localFileName = storageKey.slice("local/".length);
    const localPath = path.join(process.cwd(), "public", "uploads", localFileName);
    return readFile(localPath);
  }

  if (publicUrl?.startsWith("/uploads/")) {
    const localFileName = publicUrl.slice("/uploads/".length);
    const localPath = path.join(process.cwd(), "public", "uploads", localFileName);
    return readFile(localPath);
  }

  const s3Config = getS3Config();

  if (!s3Config) {
    throw new Error("S3 media is configured in database but S3 environment variables are missing.");
  }

  const s3 = createS3Client(s3Config);
  const object = await s3.send(
    new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: storageKey,
    }),
  );

  if (!object.Body) {
    throw new Error("S3 media object body missing.");
  }

  const byteArray = await object.Body.transformToByteArray();
  return Buffer.from(byteArray);
}
