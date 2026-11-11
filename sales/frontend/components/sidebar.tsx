
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
  { name: "Dashboard", href: "/", icon: "⌂" },
  { name: "Customer Management", href: "/customers", icon: "♙" },
  { name: "Sales Processing", href: "/quotations", icon: "▤" },
  { name: "Delivery & Returns", href: "/deliveries", icon: "⇢" },
  { name: "Billing & Collections", href: "/invoices", icon: "▧" },
  { name: "Sales Reports", href: "/reports", icon: "▥" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

      const response = await fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
    } catch {
      alert("Unable to log out. Please check your connection and try again.");
      setLoggingOut(false);
    }
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      {/* Brand */}
      <div
        className={`flex h-[88px] shrink-0 items-center border-b border-slate-200 ${
          collapsed ? "justify-center px-2" : "justify-between px-5"
        }`}
      >
        <div className={collapsed ? "hidden" : "min-w-0"}>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Sales ERP
          </h1>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            Sales &amp; Customer Management
          </p>
        </div>

        {collapsed && (
          <span className="text-xl font-extrabold text-blue-700">
            S
          </span>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto p-3">
        {!collapsed && (
          <p className="px-3 pb-3 pt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            Main Menu
          </p>
        )}

        {menuItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-lg text-sm font-semibold transition ${
                collapsed ? "justify-center px-2" : "gap-3 px-3"
              } ${
                active
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"
              }`}
            >
              <span
                className="flex w-6 shrink-0 items-center justify-center text-lg"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? "Log out" : undefined}
          className={`flex min-h-11 w-full items-center rounded-lg text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 ${
            collapsed ? "justify-center px-2" : "gap-3 px-3"
          }`}
        >
          <span className="flex w-6 shrink-0 items-center justify-center text-lg">
            ↪
          </span>

          {!collapsed && (
            <span>{loggingOut ? "Logging out..." : "Log out"}</span>
          )}
        </button>

        {!collapsed && (
          <p className="mt-3 px-3 text-[10px] font-medium text-slate-400">
            Sales Module ERP
          </p>
        )}
      </div>
    </aside>
  );
}
