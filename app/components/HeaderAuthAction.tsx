"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function hasCookie(name: string) {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((row) => row.startsWith(`${name}=`));
}

export default function HeaderAuthAction() {
  const pathname = usePathname();
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminLoginPage = pathname === "/admin/login";

  useEffect(() => {
    function updateAuth() {
      setIsCustomerLoggedIn(hasCookie("user_token"));
    }

    updateAuth();

    window.addEventListener("storage", updateAuth);
    window.addEventListener("auth-updated", updateAuth);

    return () => {
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("auth-updated", updateAuth);
    };
  }, []);

  if (isAdminLoginPage) return null;

  if (isAdminPage) {
    return (
      <button
        type="button"
        onClick={async () => {
          await fetch("/api/admin/logout", { method: "POST" });
          window.location.href = "/admin/login";
        }}
        className="rounded-md px-3 py-1 hover:bg-black/5"
      >
        Logout
      </button>
    );
  }

  if (isCustomerLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/account" className="rounded-md px-3 py-1 hover:bg-black/5">
          Account
        </Link>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.dispatchEvent(new Event("auth-updated"));
            window.location.href = "/";
          }}
          className="rounded-md px-3 py-1 hover:bg-black/5"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <Link href="/login" className="rounded-md px-3 py-1 hover:bg-black/5">
      Login
    </Link>
  );
}