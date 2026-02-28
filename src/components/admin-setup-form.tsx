"use client";

import { FormEvent, useState } from "react";

export function AdminSetupForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Setup failed." }));
        throw new Error(body.message || "Setup failed.");
      }

      window.location.href = "/admin";
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "Setup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6">
      <h1 className="text-2xl font-bold text-white">Create Admin Login</h1>
      <p className="text-sm text-zinc-400">First visit setup: create credentials for estimate management.</p>

      <label className="block space-y-1 text-sm text-zinc-300">
        <span>Username</span>
        <input
          required
          minLength={3}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
        />
      </label>

      <label className="block space-y-1 text-sm text-zinc-300">
        <span>Password</span>
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
        />
      </label>

      <label className="block space-y-1 text-sm text-zinc-300">
        <span>Confirm Password</span>
        <input
          required
          type="password"
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
        />
      </label>

      {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      <button
        disabled={loading}
        type="submit"
        className="w-full rounded-md bg-yellow-400 px-4 py-2 font-semibold text-black disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create Admin Account"}
      </button>
    </form>
  );
}
