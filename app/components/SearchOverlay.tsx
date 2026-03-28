"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      {/* Search Icon */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-md px-3 py-2 text-sm hover:bg-black/5"
        aria-label="Search"
        type="button"
      >
        🔍
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Search</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-black/60 hover:text-black"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSearch} className="mt-4">
              <input
                autoFocus
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-black/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
}