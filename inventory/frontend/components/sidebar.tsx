
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserProfile from "./userprofile";

const navigation = [
  { name: "Dashboard", href: "/", icon: "▦" },
  { name: "Items", href: "/items", icon: "▣" },
  { name: "Warehouses", href: "/warehouses", icon: "▤" },
  { name: "Stock Actions", href: "/stock-actions", icon: "⇄" },
  { name: "Stock Ledger", href: "/stock-ledger", icon: "▤" },
  { name: "Reports", href: "/reports", icon: "▥" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[198px] shrink-0 flex-col rounded-[24px] bg-[#35636B] p-3 text-white">
      {/* Department Header */}
      <div className="mb-5 flex items-center gap-2 px-2 py-3">
        <div className="h-8 w-8 rounded-full bg-[#B8D5D7]" />
        <span className="text-sm font-bold tracking-wide">
          INVENTORY
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        {navigation.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[#668F98] text-white"
                  : "text-white hover:bg-[#527982]"
              }`}
            >
              <span className="w-5 text-center text-lg">
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <UserProfile name="Inventory User" role="Employee" />
    </aside>
  );
}
