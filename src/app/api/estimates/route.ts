import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { estimateRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`estimate:${ip}`, 5, 10 * 60 * 1000);

  if (!rate.allowed) {
    return NextResponse.json({ message: "Too many estimate requests. Please try again later." }, { status: 429 });
  }

  const payload = await request.json();
  const parsed = estimateRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Please check your form and try again.",
        issues: process.env.NODE_ENV === "development" ? parsed.error.flatten() : undefined,
      },
      { status: 400 },
    );
  }

  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json({ message: "Request submitted." });
  }

  await prisma.estimateRequest.create({
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phoneNumber: parsed.data.phoneNumber,
      projectDescription: parsed.data.projectDescription,
      preferredTimeline: parsed.data.preferredTimeline || null,
      preferredContactTime: parsed.data.preferredContactTime || null,
      consent: parsed.data.consent,
      ipAddress: ip,
      mediaAssets: {
        create: parsed.data.uploadedAssets.map((asset) => ({
          storageKey: asset.storageKey,
          publicUrl: asset.publicUrl,
          mimeType: asset.mimeType,
          fileSize: asset.fileSize,
        })),
      },
    },
  });

  return NextResponse.json({ message: "Estimate request submitted successfully." });
}
