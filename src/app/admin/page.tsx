import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdminAuth } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdminAuth();

  const estimates = await prisma.estimateRequest.findMany({
    include: { mediaAssets: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const projects = await prisma.portfolioProject.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const reviewSettings = await prisma.siteSetting.findUnique({
    where: { singletonKey: 1 },
  });

  const initialEstimates = estimates.map((estimate) => ({
    ...estimate,
    createdAt: estimate.createdAt.toISOString(),
  }));

  const initialProjects = projects.map((project) => ({
    ...project,
    createdAt: project.createdAt.toISOString(),
  }));

  const initialTestimonials = testimonials.map((testimonial) => ({
    ...testimonial,
    createdAt: testimonial.createdAt.toISOString(),
    updatedAt: testimonial.updatedAt.toISOString(),
    approvedAt: testimonial.approvedAt?.toISOString() ?? null,
  }));

  const initialReviewSettings = {
    showReviewsSection: reviewSettings?.showReviewsSection ?? true,
    showOnlyFeaturedReviews: reviewSettings?.showOnlyFeaturedReviews ?? false,
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <AdminDashboard
          initialEstimates={initialEstimates}
          initialProjects={initialProjects}
          initialTestimonials={initialTestimonials}
          initialReviewSettings={initialReviewSettings}
          adminUsername={admin.username}
        />
      </div>
    </main>
  );
}
