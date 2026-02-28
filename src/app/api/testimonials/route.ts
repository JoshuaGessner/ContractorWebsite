import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const testimonialSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  location: z.string().trim().max(120).optional(),
  review: z.string().trim().min(20).max(2000),
  website: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`testimonial:${ip}`, 4, 10 * 60 * 1000);

  if (!rate.allowed) {
    return NextResponse.json({ message: "Too many submissions. Please try again later." }, { status: 429 });
  }

  const payload = await request.json();
  const parsed = testimonialSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Please review your testimonial and try again." }, { status: 400 });
  }

  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json({ message: "Testimonial submitted." });
  }

  await prisma.testimonial.create({
    data: {
      fullName: parsed.data.fullName,
      location: parsed.data.location || null,
      review: parsed.data.review,
      status: "PENDING",
    },
  });

  return NextResponse.json({ message: "Testimonial submitted for review." });
}
