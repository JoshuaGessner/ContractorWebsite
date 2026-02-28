import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const updateSettingsSchema = z.object({
  showReviewsSection: z.boolean(),
  showOnlyFeaturedReviews: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = updateSettingsSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid review settings." }, { status: 400 });
  }

  const settings = await prisma.siteSetting.upsert({
    where: { singletonKey: 1 },
    update: {
      showReviewsSection: parsed.data.showReviewsSection,
      showOnlyFeaturedReviews: parsed.data.showOnlyFeaturedReviews,
    },
    create: {
      singletonKey: 1,
      showReviewsSection: parsed.data.showReviewsSection,
      showOnlyFeaturedReviews: parsed.data.showOnlyFeaturedReviews,
    },
  });

  return NextResponse.json({
    settings: {
      showReviewsSection: settings.showReviewsSection,
      showOnlyFeaturedReviews: settings.showOnlyFeaturedReviews,
    },
  });
}
