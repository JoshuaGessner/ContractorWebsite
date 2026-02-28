"use client";

import { FormEvent, useState } from "react";

export function TestimonialForm() {
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [review, setReview] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, location, review, website }),
      });

      const body = await response.json().catch(() => ({ message: "Submission failed." }));

      if (!response.ok) {
        throw new Error(body.message || "Submission failed.");
      }

      setFullName("");
      setLocation("");
      setReview("");
      setWebsite("");
      setMessage("Thank you. Your testimonial was submitted for owner approval.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-black/45 p-5">
      <h3 className="text-xl font-semibold text-white">Leave a Customer Review</h3>

      <label className="block space-y-1 text-sm text-zinc-300">
        <span>Name</span>
        <input
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
        />
      </label>

      <label className="block space-y-1 text-sm text-zinc-300">
        <span>City / Area (optional)</span>
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
        />
      </label>

      <label className="block space-y-1 text-sm text-zinc-300">
        <span>Review</span>
        <textarea
          required
          rows={4}
          value={review}
          onChange={(event) => setReview(event.target.value)}
          className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
        />
      </label>

      <label className="hidden">
        Website
        <input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
      </label>

      {error ? <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      {message ? (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-yellow-400 px-4 py-2 font-semibold text-black disabled:opacity-60"
      >
        {busy ? "Submitting..." : "Submit Testimonial"}
      </button>
    </form>
  );
}
