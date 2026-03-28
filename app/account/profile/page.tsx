"use client";

import { useEffect, useState } from "react";

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
};

export default function AccountProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/account/profile", {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to load profile");
      setLoading(false);
      return;
    }

    setProfile(data.user ?? null);
    setFullName(data.user?.full_name ?? "");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);

    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to update profile");
      return;
    }

    setProfile(data.user ?? null);
    setFullName(data.user?.full_name ?? "");
    setMsg("Profile updated successfully.");
  }

  if (loading) {
    return <div className="py-10 text-black/70">Loading...</div>;
  }

  if (!profile) {
    return <div className="py-10 text-black/70">{msg ?? "Profile not found."}</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="mt-2 text-black/70">
          View and update your profile details.
        </p>
      </div>

      {msg && (
        <div className="rounded-md border border-black/10 bg-black/5 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <input
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 bg-black/5"
            value={profile.email}
            readOnly
          />
          <div className="mt-1 text-xs text-black/60">
            Email cannot be changed right now.
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm font-medium">Verified</div>
            <div className="mt-1 text-black/70">
              {profile.is_verified ? "Yes" : "No"}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Member Since</div>
            <div className="mt-1 text-black/70">
              {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}