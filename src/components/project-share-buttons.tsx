"use client";

import { useMemo, useState } from "react";

type Props = {
  projectTitle: string;
  mediaUrl: string;
};

function toAbsoluteUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (typeof window === "undefined") {
    return url;
  }

  return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
}

export function ProjectShareButtons({ projectTitle, mediaUrl }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const absoluteUrl = useMemo(() => toAbsoluteUrl(mediaUrl), [mediaUrl]);

  const encodedUrl = encodeURIComponent(absoluteUrl);
  const encodedTitle = encodeURIComponent(projectTitle);

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const xUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setMessage("Link copied.");
      window.setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage("Unable to copy link.");
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onCopy()}
          className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200"
        >
          Copy Link
        </button>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200"
        >
          Facebook
        </a>
        <a href={xUrl} target="_blank" rel="noreferrer" className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200">
          X
        </a>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200"
        >
          LinkedIn
        </a>
      </div>
      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}
