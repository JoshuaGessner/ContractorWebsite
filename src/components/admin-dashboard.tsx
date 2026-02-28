"use client";

import { useState } from "react";
import { AdminEstimatesManager } from "@/components/admin-estimates-manager";
import { AdminPortfolioManager } from "@/components/admin-portfolio-manager";
import { AdminTestimonialsManager } from "@/components/admin-testimonials-manager";

type EstimateRow = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  projectDescription: string;
  preferredTimeline: string | null;
  preferredContactTime: string | null;
  status: string;
  createdAt: string;
  mediaAssets: {
    id: string;
    storageKey: string;
    publicUrl: string | null;
    mimeType: string;
    fileSize: number;
  }[];
};

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  mediaType: string;
  mediaUrl: string;
  storageKey: string;
  fileSize: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  mediaAssets: {
    id: string;
    mediaType: string;
    mediaUrl: string;
    storageKey: string;
    fileSize: number;
    sortOrder: number;
    createdAt: string;
  }[];
};

type Props = {
  initialEstimates: EstimateRow[];
  initialProjects: ProjectRow[];
  initialTestimonials: TestimonialRow[];
  initialReviewSettings: ReviewSettings;
  adminUsername: string;
};

type TestimonialRow = {
  id: string;
  fullName: string;
  location: string | null;
  review: string;
  status: string;
  isFeatured: boolean;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReviewSettings = {
  showReviewsSection: boolean;
  showOnlyFeaturedReviews: boolean;
};

export function AdminDashboard({ initialEstimates, initialProjects, initialTestimonials, initialReviewSettings, adminUsername }: Props) {
  const [tab, setTab] = useState<"estimates" | "portfolio" | "testimonials">("estimates");

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-sm text-zinc-400">Signed in as {adminUsername}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab("estimates")}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab === "estimates"
                ? "bg-yellow-400 text-black"
                : "border border-white/20 text-zinc-200"
            }`}
          >
            Estimates
          </button>
          <button
            onClick={() => setTab("portfolio")}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab === "portfolio"
                ? "bg-yellow-400 text-black"
                : "border border-white/20 text-zinc-200"
            }`}
          >
            Media Upload
          </button>
          <button
            onClick={() => setTab("testimonials")}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab === "testimonials"
                ? "bg-yellow-400 text-black"
                : "border border-white/20 text-zinc-200"
            }`}
          >
            Testimonials
          </button>
          </div>

          <button
            onClick={onLogout}
            className="rounded-md border border-yellow-400/40 px-3 py-2 text-sm font-medium text-yellow-300"
          >
            Logout
          </button>
        </div>
      </div>

      {tab === "estimates" ? (
        <AdminEstimatesManager initialEstimates={initialEstimates} adminUsername={adminUsername} />
      ) : tab === "portfolio" ? (
        <AdminPortfolioManager initialProjects={initialProjects} />
      ) : (
        <AdminTestimonialsManager initialTestimonials={initialTestimonials} initialReviewSettings={initialReviewSettings} />
      )}
    </div>
  );
}
