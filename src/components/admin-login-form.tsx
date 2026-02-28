"use client";

import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Login failed." }));
        throw new Error(body.message || "Login failed.");
      }

      window.location.href = "/admin";
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6">
      <h1 className="text-2xl font-bold text-white">Admin Login</h1>
      <p className="text-sm text-zinc-400">Sign in to manage estimates and exports.</p>

      <label className="block space-y-1 text-sm text-zinc-300">
        <span>Username</span>
        <input
          required
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
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-white/20 bg-zinc-900 px-3 py-2 text-white"
        />
      </label>

      {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      <button
        disabled={loading}
        type="submit"
        className="w-full rounded-md bg-yellow-400 px-4 py-2 font-semibold text-black disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
