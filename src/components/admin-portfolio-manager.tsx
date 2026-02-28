"use client";

import { FormEvent, useState } from "react";

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
  initialProjects: ProjectRow[];
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

export function AdminPortfolioManager({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

  async function shareLink(url: string, titleText: string) {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titleText, url });
        setMessage("Share sheet opened.");
        return;
      } catch {
        return;
      }
    }

    await navigator.clipboard.writeText(url);
    setMessage("Link copied to clipboard.");
  }

  function toAbsoluteUrl(url: string) {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    if (typeof window !== "undefined") {
      return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
    }

    return url;
  }

  function socialShareUrls(url: string, titleText: string) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(titleText);

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };
  }

  async function uploadMedia(fileToUpload: File) {
    const formData = new FormData();
    formData.append("file", fileToUpload);

    const uploadResponse = await fetch("/api/uploads?scope=portfolio", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const body = await uploadResponse.json().catch(() => ({ message: "Upload failed." }));
      throw new Error(body.message || "Upload failed.");
    }

    return (await uploadResponse.json()) as {
      storageKey: string;
      publicUrl: string | null;
      mimeType: string;
      fileSize: number;
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (files.length === 0) {
      setError("Please select at least one image or video file.");
      return;
    }

    setBusy(true);

    try {
      const uploadedAssets: {
        mediaType: string;
        mediaUrl: string;
        storageKey: string;
        fileSize: number;
      }[] = [];

      for (const file of files) {
        const uploaded = await uploadMedia(file);

        if (!uploaded.publicUrl) {
          throw new Error("Uploaded media URL missing. Configure S3_PUBLIC_BASE_URL or use local uploads.");
        }

        uploadedAssets.push({
          mediaType: uploaded.mimeType,
          mediaUrl: uploaded.publicUrl,
          storageKey: uploaded.storageKey,
          fileSize: uploaded.fileSize,
        });
      }

      const createResponse = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          mediaAssets: uploadedAssets,
          isPublished,
        }),
      });

      if (!createResponse.ok) {
        const body = await createResponse.json().catch(() => ({ message: "Failed to create project." }));
        throw new Error(body.message || "Failed to create project.");
      }

      const payload = (await createResponse.json()) as { project: ProjectRow };

      setProjects((current) => [
        {
          ...payload.project,
          createdAt: payload.project.createdAt,
        },
        ...current,
      ]);

      setTitle("");
      setDescription("");
      setFiles([]);
      setIsPublished(true);
      setMessage("Project created with media files. It now appears on the public site portfolio.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to add project.");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteProject(id: string) {
    const confirmed = window.confirm("Delete this project media entry?");

    if (!confirmed) {
      return;
    }

    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: "Delete failed." }));
      setError(body.message || "Delete failed.");
      return;
    }

    setProjects((current) => current.filter((project) => project.id !== id));
    setMessage("Project media deleted.");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <h2 className="text-xl font-bold text-white">Media Upload</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Add portfolio projects with a title, description, and media. Published entries automatically appear on the
          public website.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void shareLink(`${siteOrigin}/#portfolio`, "All Terrain Development Portfolio")}
            className="rounded border border-yellow-400/40 px-2 py-1 text-xs text-yellow-300"
          >
            Share Portfolio Page
          </button>
          <button
            type="button"
            onClick={() => void shareLink(siteOrigin || "/", "All Terrain Development")}
            className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200"
          >
            Copy Website Link
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-zinc-300">
            <span>Project Title</span>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
            />
          </label>

          <label className="space-y-1 text-sm text-zinc-300">
            <span>Project Photos/Videos</span>
            <input
              required
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-zinc-200"
            />
            <p className="text-xs text-zinc-400">
              Pick one or more files. You can mix photos and videos in the same project.
            </p>
          </label>
        </div>

        {files.length > 0 ? (
          <div className="rounded-md border border-white/10 bg-zinc-950/60 p-3">
            <p className="text-sm font-medium text-zinc-200">Selected Files ({files.length})</p>
            <ul className="mt-2 space-y-1 text-xs text-zinc-300">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`}>
                  {file.name} · {file.type || "unknown"} · {formatBytes(file.size)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <label className="block space-y-1 text-sm text-zinc-300">
          <span>Description</span>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            className="h-4 w-4"
          />
          Publish immediately
        </label>

        {error && <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
        {message && (
          <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {message}
          </p>
        )}

        <button
          disabled={busy}
          type="submit"
          className="rounded-md bg-yellow-400 px-4 py-2 font-semibold text-black disabled:opacity-60"
        >
          {busy ? "Uploading Files..." : "Create Project"}
        </button>
      </form>

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
        <h3 className="text-lg font-semibold text-white">Existing Projects</h3>

        {projects.length === 0 ? (
          <p className="text-sm text-zinc-400">No project entries yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((project) => (
              <article key={project.id} className="rounded-md border border-white/10 bg-zinc-900/60 p-3">
                {project.mediaAssets.length > 0 && isImageType(project.mediaAssets[0].mediaType) ? (
                  <div
                    className="mb-2 h-36 w-full rounded bg-cover bg-center"
                    style={{ backgroundImage: `url(${project.mediaAssets[0].mediaUrl})` }}
                  />
                ) : project.mediaAssets.length > 0 && isVideoType(project.mediaAssets[0].mediaType) ? (
                  <video controls className="mb-2 h-36 w-full rounded bg-black" preload="metadata">
                    <source src={project.mediaAssets[0].mediaUrl} type={project.mediaAssets[0].mediaType} />
                  </video>
                ) : (
                  <div className="mb-2 flex h-36 w-full items-center justify-center rounded bg-zinc-800 text-xs text-zinc-300">
                    Preview not available
                  </div>
                )}

                {project.mediaAssets.length > 1 ? (
                  <div className="mb-2 grid grid-cols-4 gap-1">
                    {project.mediaAssets.slice(1, 5).map((asset) =>
                      isImageType(asset.mediaType) ? (
                        <div
                          key={asset.id}
                          className="h-12 rounded bg-cover bg-center"
                          style={{ backgroundImage: `url(${asset.mediaUrl})` }}
                        />
                      ) : (
                        <div
                          key={asset.id}
                          className="flex h-12 items-center justify-center rounded bg-black text-[10px] text-zinc-300"
                        >
                          Video
                        </div>
                      ),
                    )}
                  </div>
                ) : null}

                <h4 className="font-semibold text-white">{project.title}</h4>
                <p className="mt-1 line-clamp-3 text-sm text-zinc-300">{project.description}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  {project.mediaAssets.length} file{project.mediaAssets.length === 1 ? "" : "s"} · {project.isPublished ? "Published" : "Hidden"}
                </p>

                {(() => {
                  const primaryMedia = project.mediaAssets[0]?.mediaUrl ?? project.mediaUrl;
                  const projectUrl = toAbsoluteUrl(primaryMedia);
                  const shareUrls = socialShareUrls(projectUrl, project.title);

                  return (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void shareLink(projectUrl, project.title)}
                        className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200"
                      >
                        Copy Link
                      </button>
                      <a
                        href={shareUrls.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200"
                      >
                        Facebook
                      </a>
                      <a
                        href={shareUrls.x}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200"
                      >
                        X
                      </a>
                      <a
                        href={shareUrls.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200"
                      >
                        LinkedIn
                      </a>
                    </div>
                  );
                })()}

                <div className="mt-3 flex gap-2">
                  <a
                    href={project.mediaAssets[0]?.mediaUrl ?? project.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-yellow-400/40 px-2 py-1 text-xs text-yellow-300"
                  >
                    Open
                  </a>
                  <button
                    onClick={() => void onDeleteProject(project.id)}
                    className="rounded bg-red-500/80 px-2 py-1 text-xs font-semibold text-white"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
