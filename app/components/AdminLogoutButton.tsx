"use client";

export default function AdminLogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/login";
      }}
      className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
    >
      Logout
    </button>
  );
}