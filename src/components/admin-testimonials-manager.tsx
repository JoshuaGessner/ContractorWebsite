"use client";

import { useMemo, useState } from "react";

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

type Props = {
  initialTestimonials: TestimonialRow[];
  initialReviewSettings: {
    showReviewsSection: boolean;
    showOnlyFeaturedReviews: boolean;
  };
};

export function AdminTestimonialsManager({ initialTestimonials, initialReviewSettings }: Props) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [reviewSettings, setReviewSettings] = useState(initialReviewSettings);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return testimonials;
    return testimonials.filter((item) => item.status === statusFilter);
  }, [testimonials, statusFilter]);

  async function updateStatus(id: string, status: "APPROVED" | "REJECTED" | "PENDING") {
    setBusyId(id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const body = await response.json().catch(() => ({ message: "Update failed." }));

      if (!response.ok) {
        throw new Error(body.message || "Update failed.");
      }

      const updated = body.testimonial as TestimonialRow;
      setTestimonials((current) => current.map((item) => (item.id === id ? updated : item)));
      setMessage(`Updated testimonial to ${status}.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFeatured(id: string, isFeatured: boolean) {
    setBusyId(id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isFeatured }),
      });

      const body = await response.json().catch(() => ({ message: "Update failed." }));

      if (!response.ok) {
        throw new Error(body.message || "Update failed.");
      }

      const updated = body.testimonial as TestimonialRow;
      setTestimonials((current) => current.map((item) => (item.id === id ? updated : item)));
      setMessage(updated.isFeatured ? "Marked testimonial as featured." : "Removed testimonial from featured.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveReviewSettings(nextSettings: { showReviewsSection: boolean; showOnlyFeaturedReviews: boolean }) {
    setSettingsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/review-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });

      const body = await response.json().catch(() => ({ message: "Settings update failed." }));

      if (!response.ok) {
        throw new Error(body.message || "Settings update failed.");
      }

      setReviewSettings(body.settings);
      setMessage("Review section settings updated.");
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : "Settings update failed.");
    } finally {
      setSettingsBusy(false);
    }
  }

  async function deleteTestimonial(id: string) {
    const confirmed = window.confirm("Delete this testimonial permanently?");

    if (!confirmed) {
      return;
    }

    setBusyId(id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const body = await response.json().catch(() => ({ message: "Delete failed." }));

      if (!response.ok) {
        throw new Error(body.message || "Delete failed.");
      }

      setTestimonials((current) => current.filter((item) => item.id !== id));
      setMessage("Testimonial deleted.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <h2 className="text-xl font-bold text-white">Testimonial Moderation</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Review incoming customer testimonials and approve before they appear on the public website.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <h3 className="mb-3 text-base font-semibold text-white">Public Reviews Controls</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={reviewSettings.showReviewsSection}
              disabled={settingsBusy}
              onChange={(event) =>
                void saveReviewSettings({
                  ...reviewSettings,
                  showReviewsSection: event.target.checked,
                })
              }
              className="h-4 w-4"
            />
            Show customer reviews section on public site
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={reviewSettings.showOnlyFeaturedReviews}
              disabled={settingsBusy}
              onChange={(event) =>
                void saveReviewSettings({
                  ...reviewSettings,
                  showOnlyFeaturedReviews: event.target.checked,
                })
              }
              className="h-4 w-4"
            />
            Show only featured approved testimonials
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <label className="space-y-1 text-sm text-zinc-300">
          <span>Status Filter</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "ALL" | "PENDING" | "APPROVED" | "REJECTED")}
            className="w-full max-w-xs rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
      </div>

      {error ? <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      {message ? (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>
      ) : null}

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-400">No testimonials in this filter.</p>
        ) : (
          filtered.map((item) => (
            <article key={item.id} className="rounded-md border border-white/10 bg-zinc-900/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white">{item.fullName}</h3>
                  <p className="text-xs text-zinc-400">
                    {item.location || "Location not provided"} · Submitted {new Date(item.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-zinc-300">Status: {item.status}</p>
                  <p className="mt-1 text-xs text-zinc-300">Featured: {item.isFeatured ? "Yes" : "No"}</p>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-200">{item.review}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void updateStatus(item.id, "APPROVED")}
                  className="rounded border border-emerald-400/40 px-2 py-1 text-xs text-emerald-200 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void updateStatus(item.id, "REJECTED")}
                  className="rounded border border-yellow-400/40 px-2 py-1 text-xs text-yellow-200 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void updateStatus(item.id, "PENDING")}
                  className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200 disabled:opacity-50"
                >
                  Move to Pending
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void toggleFeatured(item.id, !item.isFeatured)}
                  className="rounded border border-cyan-400/40 px-2 py-1 text-xs text-cyan-200 disabled:opacity-50"
                >
                  {item.isFeatured ? "Unfeature" : "Feature"}
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void deleteTestimonial(item.id)}
                  className="rounded bg-red-500/80 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
