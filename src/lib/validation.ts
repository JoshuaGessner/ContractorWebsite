import { z } from "zod";

const publicUrlSchema = z
  .string()
  .refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), {
    message: "publicUrl must be an absolute URL or a local path.",
  });

const uploadedAssetSchema = z.object({
  storageKey: z.string().min(3),
  publicUrl: publicUrlSchema.nullable(),
  mimeType: z.string().min(3),
  fileSize: z.number().int().positive(),
});

export const estimateRequestSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phoneNumber: z.string().min(7).max(30),
  projectDescription: z.string().min(20).max(8000),
  preferredTimeline: z.string().max(120).optional().or(z.literal("")),
  preferredContactTime: z.string().max(120).optional().or(z.literal("")),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
  uploadedAssets: z.array(uploadedAssetSchema).max(12),
});

export const signUploadSchema = z.object({
  fileName: z.string().min(1).max(240),
  fileType: z.string().min(3).max(120),
  fileSize: z.number().int().positive(),
});
