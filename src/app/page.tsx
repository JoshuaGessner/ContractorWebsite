import { EstimateForm } from "@/components/estimate-form";
import { ProjectShareButtons } from "@/components/project-share-buttons";
import { TestimonialForm } from "@/components/testimonial-form";
import { prisma } from "@/lib/prisma";

export default function Home() {
  const projectsPromise = prisma.portfolioProject.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const reviewSettingsPromise = prisma.siteSetting.findUnique({
    where: { singletonKey: 1 },
  });

  const testimonialsPromise = prisma.testimonial.findMany({
    where: { status: "APPROVED" },
    orderBy: [{ isFeatured: "desc" }, { approvedAt: "desc" }],
    take: 8,
  });

  return (
    <HomeView
      projectsPromise={projectsPromise}
      testimonialsPromise={testimonialsPromise}
      reviewSettingsPromise={reviewSettingsPromise}
    />
  );
}

async function HomeView({
  projectsPromise,
  testimonialsPromise,
  reviewSettingsPromise,
}: {
  projectsPromise: ReturnType<typeof prisma.portfolioProject.findMany>;
  testimonialsPromise: ReturnType<typeof prisma.testimonial.findMany>;
  reviewSettingsPromise: ReturnType<typeof prisma.siteSetting.findUnique>;
}) {
  const [projects, testimonials, reviewSettings] = await Promise.all([
    projectsPromise,
    testimonialsPromise,
    reviewSettingsPromise,
  ]);

  const showReviewsSection = reviewSettings?.showReviewsSection ?? true;
  const showOnlyFeaturedReviews = reviewSettings?.showOnlyFeaturedReviews ?? false;
  const visibleTestimonials = showOnlyFeaturedReviews
    ? testimonials.filter((testimonial) => testimonial.isFeatured)
    : testimonials;

  const photoProjects = projects.filter((project) => project.mediaType.startsWith("image/"));
  const videoProjects = projects.filter((project) => project.mediaType.startsWith("video/"));

  const photoItems = photoProjects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    imageUrl: project.mediaUrl,
  }));

  const videoItems = videoProjects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    videoUrl: project.mediaUrl,
    videoType: project.mediaType,
  }));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#485a39_0%,#11130f_45%,#060606_100%)] text-zinc-100">
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 sm:px-8 lg:px-10">
        <nav className="mb-12 flex items-center justify-between rounded-full border border-white/15 bg-black/40 px-5 py-3 backdrop-blur">
          <span className="text-lg font-bold tracking-wide text-yellow-300">ALL TERRAIN DEVELOPMENT</span>
          <a
            href="#estimate"
            className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            Get Estimate
          </a>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-white/10 bg-black/45 p-8 backdrop-blur">
            <p className="inline-block rounded-full border border-yellow-400/40 bg-yellow-400/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-yellow-300">
              Southern Tough. Modern Finish.
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Earthwork and landscaping built with precision, grit, and clean design.
            </h1>
            <p className="mt-5 max-w-xl text-zinc-300">
              From grading and retaining walls to patios, drainage, and full property upgrades, we deliver
              dependable craftsmanship with equipment-ready execution and sharp curb appeal.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {["Licensed & Insured", "Residential + Commercial", "Detail-First Estimates"].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-zinc-950/80 p-4 text-sm text-zinc-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <section id="estimate" className="rounded-3xl border border-yellow-500/30 bg-zinc-950/80 p-3">
            <EstimateForm />
          </section>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:px-8 lg:px-10" id="portfolio">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Project Portfolio</h2>
            <p className="mt-2 text-zinc-300">Recent photo and video highlights from our field work.</p>
          </div>
        </div>

        {photoItems.length === 0 && videoItems.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/45 p-6 text-sm text-zinc-300">
            Portfolio items will appear here after they are uploaded from the admin dashboard.
          </div>
        ) : null}

        {photoItems.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-3">
            {photoItems.map((project) => (
              <article key={project.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/45">
                <div className="h-52 w-full bg-zinc-900">
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${project.imageUrl})` }}
                    aria-label={project.title}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white">{project.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{project.description}</p>
                  <ProjectShareButtons projectTitle={project.title} mediaUrl={project.imageUrl} />
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {videoItems.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {videoItems.map((project) => (
              <article key={project.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/45">
                <video controls className="h-64 w-full bg-black" preload="metadata">
                  <source src={project.videoUrl} type={project.videoType} />
                </video>
                <div className="p-4">
                  <h3 className="font-semibold text-white">{project.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{project.description}</p>
                  <ProjectShareButtons projectTitle={project.title} mediaUrl={project.videoUrl} />
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {showReviewsSection ? (
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10" id="testimonials">
        <div className="rounded-2xl border border-white/10 bg-black/45 p-5">
          <h2 className="text-3xl font-bold text-white">Customer Reviews</h2>
          <p className="mt-2 text-zinc-300">Approved testimonials from past clients.</p>

          {visibleTestimonials.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No approved testimonials yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {visibleTestimonials.map((testimonial) => (
                <article key={testimonial.id} className="rounded-xl border border-white/10 bg-zinc-950/70 p-4">
                  {testimonial.isFeatured ? (
                    <span className="inline-block rounded-full border border-yellow-400/40 bg-yellow-400/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-yellow-300">
                      Featured Review
                    </span>
                  ) : null}
                  <p className="text-sm leading-6 text-zinc-200">“{testimonial.review}”</p>
                  <p className="mt-2 text-xs text-zinc-400">
                    — {testimonial.fullName}
                    {testimonial.location ? `, ${testimonial.location}` : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <TestimonialForm />
      </section>
      ) : null}
    </main>
  );
}
