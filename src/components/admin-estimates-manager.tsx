"use client";

import { useEffect, useMemo, useState } from "react";

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

type Props = {
  initialEstimates: EstimateRow[];
  adminUsername: string;
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isVideoType(mimeType: string) {
  return mimeType.startsWith("video/");
}

async function downloadFileFromEndpoint(endpoint: string, ids: string[]) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Operation failed." }));
    throw new Error(body.message || "Operation failed.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const filenameMatch = disposition.match(/filename="([^"]+)"/);
  const filename = filenameMatch?.[1] || "download.bin";
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function AdminEstimatesManager({ initialEstimates, adminUsername }: Props) {
  const [estimates, setEstimates] = useState(initialEstimates);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState<"download" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeEstimateId, setActiveEstimateId] = useState<string | null>(null);

  const pageSize = 10;

  const filteredEstimates = useMemo(() => {
    return estimates.filter((estimate) => {
      if (statusFilter !== "ALL" && estimate.status !== statusFilter) {
        return false;
      }

      if (!searchQuery.trim()) {
        return true;
      }

      const query = searchQuery.toLowerCase();

      return (
        estimate.fullName.toLowerCase().includes(query) ||
        estimate.email.toLowerCase().includes(query) ||
        estimate.phoneNumber.toLowerCase().includes(query) ||
        estimate.projectDescription.toLowerCase().includes(query)
      );
    });
  }, [estimates, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEstimates.length / pageSize));

  const pagedEstimates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEstimates.slice(start, start + pageSize);
  }, [filteredEstimates, currentPage]);

  const availableStatuses = useMemo(
    () => ["ALL", ...Array.from(new Set(estimates.map((estimate) => estimate.status)))],
    [estimates],
  );

  const allSelected = useMemo(
    () => pagedEstimates.length > 0 && pagedEstimates.every((estimate) => selectedIds.includes(estimate.id)),
    [pagedEstimates, selectedIds],
  );

  const selectedCount = selectedIds.length;

  const activeEstimate = useMemo(
    () => estimates.find((estimate) => estimate.id === activeEstimateId) || null,
    [estimates, activeEstimateId],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => filteredEstimates.some((estimate) => estimate.id === id)));
  }, [filteredEstimates]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function toggleSelectOne(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((current) => current.filter((id) => !pagedEstimates.some((estimate) => estimate.id === id)));
      return;
    }

    setSelectedIds((current) => {
      const merged = new Set(current);
      pagedEstimates.forEach((estimate) => merged.add(estimate.id));
      return Array.from(merged);
    });
  }

  async function onDownloadSelected() {
    if (!selectedIds.length) return;
    setError(null);
    setMessage(null);
    setBusyAction("download");

    try {
      await downloadFileFromEndpoint("/api/admin/estimates/export", selectedIds);
      setMessage(`Downloaded ${selectedIds.length} estimate(s) as CSV.`);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Download failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function onDeleteByIds(ids: string[]) {
    if (!ids.length) return;

    const confirmed = window.confirm(
      `Delete ${ids.length} estimate(s)? A ZIP backup with CSV + media files will be downloaded before removal.`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setMessage(null);
    setBusyAction("delete");

    try {
      await downloadFileFromEndpoint("/api/admin/estimates/delete", ids);
      setEstimates((current) => current.filter((estimate) => !ids.includes(estimate.id)));
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      if (activeEstimateId && ids.includes(activeEstimateId)) {
        setActiveEstimateId(null);
      }
      setMessage(`Deleted ${ids.length} estimate(s) and downloaded ZIP backup.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function onDeleteSelected() {
    await onDeleteByIds(selectedIds);
  }

  async function onDeleteSingle(id: string) {
    await onDeleteByIds([id]);
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 p-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Estimate Management</h1>
          <p className="text-sm text-zinc-400">Signed in as {adminUsername}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onDownloadSelected}
            disabled={!selectedCount || busyAction !== null}
            className="rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-zinc-200 disabled:opacity-50"
          >
            {busyAction === "download" ? "Downloading..." : `Download Selected (${selectedCount})`}
          </button>
          <button
            onClick={onDeleteSelected}
            disabled={!selectedCount || busyAction !== null}
            className="rounded-md bg-red-500/90 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busyAction === "delete" ? "Deleting..." : `Delete Selected (${selectedCount})`}
          </button>
          <button
            onClick={onLogout}
            className="rounded-md border border-yellow-400/40 px-3 py-2 text-sm font-medium text-yellow-300"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-white/10 bg-black/40 p-4 md:grid-cols-[1fr_180px_auto]">
        <label className="space-y-1 text-sm text-zinc-300">
          <span>Search Estimates</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Name, email, phone, or project details"
            className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
          />
        </label>

        <label className="space-y-1 text-sm text-zinc-300">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
          >
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end text-sm text-zinc-400">
          Showing {pagedEstimates.length} of {filteredEstimates.length} estimate(s)
        </div>
      </div>

      {error && <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
      {message && (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
        <table className="min-w-full text-left text-sm text-zinc-200">
          <thead className="bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-300">
            <tr>
              <th className="px-3 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all" />
              </th>
              <th className="px-3 py-3">Submitted</th>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Contact</th>
              <th className="px-3 py-3">Summary</th>
              <th className="px-3 py-3">Media</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEstimates.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-zinc-400" colSpan={7}>
                  No estimates found.
                </td>
              </tr>
            ) : (
              pagedEstimates.map((estimate) => (
                <tr key={estimate.id} className="border-t border-white/10 align-top">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(estimate.id)}
                      onChange={() => toggleSelectOne(estimate.id)}
                      aria-label={`Select ${estimate.fullName}`}
                    />
                  </td>
                  <td className="px-3 py-3 text-zinc-300">{new Date(estimate.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-white">{estimate.fullName}</p>
                    <p className="text-xs text-zinc-400">{estimate.status}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p>{estimate.email}</p>
                    <p>{estimate.phoneNumber}</p>
                  </td>
                  <td className="max-w-[28rem] px-3 py-3">
                    <p className="line-clamp-2 whitespace-pre-wrap text-zinc-300">{estimate.projectDescription}</p>
                    <p className="mt-2 text-xs text-zinc-400">
                      Timeline: {estimate.preferredTimeline || "Not specified"} | Contact:{" "}
                      {estimate.preferredContactTime || "Not specified"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    {estimate.mediaAssets.length === 0 ? (
                      <span className="text-zinc-500">None</span>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-300">{estimate.mediaAssets.length} attachment(s)</p>
                        <div className="flex gap-2">
                          {estimate.mediaAssets.slice(0, 2).map((media) => (
                            <div key={media.id} className="h-12 w-16 overflow-hidden rounded border border-white/10 bg-zinc-900">
                              {media.publicUrl && isImageType(media.mimeType) ? (
                                <div
                                  className="h-full w-full bg-cover bg-center"
                                  style={{ backgroundImage: `url(${media.publicUrl})` }}
                                  aria-label="Attachment thumbnail"
                                />
                              ) : media.publicUrl && isVideoType(media.mimeType) ? (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-300">
                                  VIDEO
                                </div>
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-500">
                                  FILE
                                </div>
                              )}
                            </div>
                          ))}
                          {estimate.mediaAssets.length > 2 && (
                            <div className="flex h-12 w-10 items-center justify-center rounded border border-white/10 bg-zinc-900 text-xs text-zinc-300">
                              +{estimate.mediaAssets.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveEstimateId(estimate.id)}
                        className="w-full rounded-md border border-yellow-400/40 px-2 py-1 text-xs font-semibold text-yellow-300"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onDeleteSingle(estimate.id)}
                        className="w-full rounded-md bg-red-500/80 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-zinc-300">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="rounded border border-white/20 px-3 py-1 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="rounded border border-white/20 px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {activeEstimate ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" role="dialog" aria-modal="true">
          <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-zinc-950 p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">{activeEstimate.fullName}</h2>
                <p className="text-sm text-zinc-400">Submitted {new Date(activeEstimate.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setActiveEstimateId(null)}
                className="rounded border border-white/20 px-3 py-1 text-sm text-zinc-200"
              >
                Close
              </button>
            </div>

            <div className="grid gap-2 rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-zinc-200 sm:grid-cols-2">
              <p>Email: {activeEstimate.email}</p>
              <p>Phone: {activeEstimate.phoneNumber}</p>
              <p>Status: {activeEstimate.status}</p>
              <p>Timeline: {activeEstimate.preferredTimeline || "Not specified"}</p>
              <p className="sm:col-span-2">Preferred Contact: {activeEstimate.preferredContactTime || "Not specified"}</p>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">Project Description</h3>
              <p className="whitespace-pre-wrap text-sm text-zinc-200">{activeEstimate.projectDescription}</p>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-300">
                Media Attachments ({activeEstimate.mediaAssets.length})
              </h3>

              {activeEstimate.mediaAssets.length === 0 ? (
                <p className="text-sm text-zinc-500">No media attached.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeEstimate.mediaAssets.map((media) => (
                    <article key={media.id} className="rounded-md border border-white/10 bg-zinc-900/60 p-3">
                      {media.publicUrl ? (
                        isImageType(media.mimeType) ? (
                          <a href={media.publicUrl} target="_blank" rel="noreferrer" className="block">
                            <div
                              className="mb-2 h-40 w-full rounded bg-cover bg-center"
                              style={{ backgroundImage: `url(${media.publicUrl})` }}
                              aria-label="Attachment preview"
                            />
                          </a>
                        ) : isVideoType(media.mimeType) ? (
                          <video controls className="mb-2 h-40 w-full rounded bg-black" preload="metadata">
                            <source src={media.publicUrl} type={media.mimeType} />
                          </video>
                        ) : (
                          <div className="mb-2 flex h-40 w-full items-center justify-center rounded bg-zinc-800 text-xs text-zinc-300">
                            Preview not available
                          </div>
                        )
                      ) : null}

                      <p className="truncate text-xs text-zinc-300" title={media.storageKey}>
                        {media.storageKey}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {media.mimeType} · {formatBytes(media.fileSize)}
                      </p>

                      {media.publicUrl ? (
                        <div className="mt-2 flex gap-2">
                          <a
                            className="rounded border border-yellow-400/40 px-2 py-1 text-xs text-yellow-300"
                            href={media.publicUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                          <a
                            className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200"
                            href={media.publicUrl}
                            download
                          >
                            Download
                          </a>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
