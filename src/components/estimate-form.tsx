"use client";

import { FormEvent, useMemo, useState } from "react";

type UploadedAsset = {
  storageKey: string;
  publicUrl: string | null;
  mimeType: string;
  fileSize: number;
};

type FormState = {
  fullName: string;
  email: string;
  phoneNumber: string;
  projectDescription: string;
  preferredTimeline: string;
  preferredContactTime: string;
  website: string;
  consent: boolean;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phoneNumber: "",
  projectDescription: "",
  preferredTimeline: "",
  preferredContactTime: "",
  website: "",
  consent: false,
};

export function EstimateForm() {
  const [formData, setFormData] = useState<FormState>(initialState);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const maxUploadHint = useMemo(() => "Photos up to 20MB each, videos up to 250MB each.", []);

  async function uploadFiles(selectedFiles: File[]) {
    const uploadedAssets: UploadedAsset[] = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorBody = await uploadResponse.json().catch(() => ({ message: "Upload failed." }));
        throw new Error(errorBody.message ?? "Upload failed.");
      }

      const uploadedFile = (await uploadResponse.json()) as {
        storageKey: string;
        publicUrl: string | null;
        mimeType: string;
        fileSize: number;
      };

      uploadedAssets.push({
        storageKey: uploadedFile.storageKey,
        publicUrl: uploadedFile.publicUrl,
        mimeType: uploadedFile.mimeType,
        fileSize: uploadedFile.fileSize,
      });
    }

    return uploadedAssets;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const uploadedAssets = files.length ? await uploadFiles(files) : [];

      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          uploadedAssets,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Unable to submit form." }));
        throw new Error(errorBody.message ?? "Unable to submit form.");
      }

      setSuccessMessage("Request sent. We will contact you shortly to confirm your estimate details.");
      setFormData(initialState);
      setFiles([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur">
      <div>
        <h3 className="text-2xl font-semibold text-white">Request a Detailed Estimate</h3>
        <p className="mt-1 text-sm text-zinc-300">
          Share project details, upload photos or videos, and our team will follow up with a tailored estimate.
        </p>
      </div>

      <input
        className="hidden"
        name="website"
        value={formData.website}
        onChange={(event) => setFormData((current) => ({ ...current, website: event.target.value }))}
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="text-zinc-200">Name</span>
          <input
            required
            value={formData.fullName}
            onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
            className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-white outline-none transition focus:border-yellow-400"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-zinc-200">Email</span>
          <input
            required
            type="email"
            value={formData.email}
            onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-white outline-none transition focus:border-yellow-400"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-zinc-200">Phone Number</span>
          <input
            required
            type="tel"
            value={formData.phoneNumber}
            onChange={(event) => setFormData((current) => ({ ...current, phoneNumber: event.target.value }))}
            className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-white outline-none transition focus:border-yellow-400"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-zinc-200">Preferred Timeline</span>
          <select
            value={formData.preferredTimeline}
            onChange={(event) => setFormData((current) => ({ ...current, preferredTimeline: event.target.value }))}
            className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-white outline-none transition focus:border-yellow-400"
          >
            <option value="">Select one</option>
            <option value="As soon as possible">As soon as possible</option>
            <option value="Within 30 days">Within 30 days</option>
            <option value="1-3 months">1-3 months</option>
            <option value="Planning only">Planning only</option>
          </select>
        </label>
      </div>

      <label className="space-y-2 text-sm">
        <span className="text-zinc-200">Preferred Contact Time</span>
        <input
          placeholder="Weekdays after 4 PM"
          value={formData.preferredContactTime}
          onChange={(event) => setFormData((current) => ({ ...current, preferredContactTime: event.target.value }))}
          className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-white outline-none transition focus:border-yellow-400"
        />
      </label>

      <label className="space-y-2 text-sm">
        <span className="text-zinc-200">Project Description (be as detailed as possible)</span>
        <textarea
          required
          minLength={20}
          rows={6}
          value={formData.projectDescription}
          onChange={(event) => setFormData((current) => ({ ...current, projectDescription: event.target.value }))}
          className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-white outline-none transition focus:border-yellow-400"
          placeholder="Describe the size of the yard, services needed, material preferences, deadlines, and any site constraints."
        />
      </label>

      <label className="space-y-2 text-sm">
        <span className="text-zinc-200">Attach Photos or Videos</span>
        <input
          multiple
          type="file"
          accept="image/*,video/*"
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          className="w-full rounded-lg border border-dashed border-yellow-400/70 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 file:mr-3 file:rounded-md file:border-0 file:bg-yellow-400 file:px-3 file:py-1 file:font-medium file:text-black"
        />
        <p className="text-xs text-zinc-400">{maxUploadHint}</p>
        {files.length > 0 && (
          <p className="text-xs text-zinc-300">{files.length} file(s) selected for upload.</p>
        )}
      </label>

      <label className="flex items-start gap-2 text-sm text-zinc-200">
        <input
          required
          type="checkbox"
          checked={formData.consent}
          onChange={(event) => setFormData((current) => ({ ...current, consent: event.target.checked }))}
          className="mt-1 h-4 w-4 rounded border-zinc-500 bg-zinc-900 text-yellow-400"
        />
        <span>
          I consent to be contacted regarding this estimate request and understand submitted information is used only
          for project quoting and follow-up.
        </span>
      </label>

      {errorMessage && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{errorMessage}</p>}
      {successMessage && (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {successMessage}
        </p>
      )}

      <button
        disabled={isSubmitting}
        type="submit"
        className="w-full rounded-lg bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit Estimate Request"}
      </button>
    </form>
  );
}
