"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
  { name: "Dashboard", href: "/", icon: "⌂" },
  { name: "Customers", href: "/customers", icon: "♙" },
  { name: "Sales Quotation", href: "/quotations", icon: "▤" },
  { name: "Sales Order", href: "/orders", icon: "▣" },
  { name: "Delivery", href: "/deliveries", icon: "↗" },
  { name: "Sales Invoice", href: "/invoices", icon: "▧" },
  {
    name: "Accounts Receivable",
    href: "/accounts-receivable",
    icon: "₱",
  },
  { name: "Collection", href: "/collections", icon: "₱" },
  { name: "Sales Return", href: "/returns", icon: "↩" },
  {
    name: "Customer Balance",
    href: "/customer-balance",
    icon: "◉",
  },
  { name: "Sales Reports", href: "/reports", icon: "▥" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
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
      router.refresh();
    } catch {
      alert("Unable to log out. Please check your connection and try again.");
    }
  }

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-6">
        <h1 className="text-xl font-bold text-gray-900">Sales ERP</h1>
        <p className="mt-1 text-xs text-gray-500">
          Sales &amp; Customer Management
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Main Menu
        </p>

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
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="w-5 text-center" aria-hidden="true">
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-gray-200 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <span className="w-5 text-center" aria-hidden="true">
            ↪
          </span>
          Log out
        </button>

        <p className="mt-3 px-3 text-xs text-gray-400">
          Sales Module ERP
        </p>
      </div>
    </aside>
  );
}