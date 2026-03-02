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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function onChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({ kind: "error", message: "New password must be at least 8 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ kind: "error", message: "New password and confirm password must match." });
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setPasswordStatus({ kind: "error", message: data.message ?? "Failed to update password." });
        return;
      }

      setPasswordStatus({ kind: "success", message: data.message ?? "Password updated. Please sign in again." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.location.href = "/admin/login";
    } catch {
      setPasswordStatus({ kind: "error", message: "Network error while updating password." });
    } finally {
      setIsChangingPassword(false);
    }
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

        <form onSubmit={onChangePassword} className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
          <h2 className="text-sm font-semibold text-white">Change Password</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
              className="rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-yellow-400"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              className="rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-yellow-400"
              minLength={8}
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-yellow-400"
              minLength={8}
              required
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="rounded-md bg-yellow-400 px-3 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChangingPassword ? "Updating..." : "Update Password"}
            </button>

            {passwordStatus ? (
              <p className={`text-sm ${passwordStatus.kind === "success" ? "text-emerald-300" : "text-red-300"}`}>
                {passwordStatus.message}
              </p>
            ) : null}
          </div>
        </form>
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
