
"use client";

import { useEffect, useState } from "react";

interface UserProfileProps {
  name?: string;
  role?: string;
}

interface SessionUser {
  username?: string;
  role?: string;
}

const HR_URL =
  process.env.NEXT_PUBLIC_HR_URL ||
  "https://computer-erp-hr-frontend.vercel.app";

export default function UserProfile({
  name = "Inventory User",
  role = "Employee",
}: UserProfileProps) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const token = sessionStorage.getItem("erp_token");

      if (!token) return;

      // Decode JWT payload for displaying user information only.
      const payload = token.split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const decoded = JSON.parse(atob(payload));

      setUser({
        username: decoded.username,
        role: decoded.role,
      });
    } catch {
      setUser(null);
    }
  }, []);

  function openMyPage() {
    const token = sessionStorage.getItem("erp_token");

    if (!token) {
      window.location.href =
        "https://computer-erp-login.vercel.app";
      return;
    }

    const baseUrl = HR_URL.replace(/\/+$/, "");

    window.location.href =
      `${baseUrl}/employee-dashboard#token=${encodeURIComponent(token)}`;
  }

  const displayName = user?.username || name;
  const displayRole = user?.role || role;

  return (
    <button
      type="button"
      onClick={openMyPage}
      title="Open my employee page"
      className="flex w-full items-center gap-3 rounded-2xl bg-[#668F98] p-3 text-left text-white transition-colors hover:bg-[#789DA5]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B8D5D7] font-semibold text-[#35636B]">
        {displayName.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-bold">
          {displayName}
        </p>
        <p className="truncate text-xs">
          {displayRole}
        </p>
      </div>
    </button>
  );
}
