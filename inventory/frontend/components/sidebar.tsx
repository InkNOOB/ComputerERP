"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ClipboardCheck,
  ArrowLeftRight,
  BookOpenText,
} from "lucide-react";
import UserProfile from "./userprofile";

const navigation = [
  { name: "Dashboard", href: "/", Icon: LayoutDashboard },
  { name: "Item Master", href: "/items", Icon: Package },
  { name: "Warehouse Management", href: "/warehouses", Icon: Warehouse },
  { name: "Approvals", href: "/approvals", Icon: ClipboardCheck },
  { name: "Stock Actions", href: "/stock_actions", Icon: ArrowLeftRight },
  { name: "Stock Ledger", href: "/stock_ledger", Icon: BookOpenText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col rounded-[24px] bg-[#365f68] p-3 text-white">

      {/* Department Header */}
      <div className="mb-5 flex items-center gap-2 px-2 py-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-[#c0d9d9]" />
        <span className="text-sm font-bold tracking-wide">
          INVENTORY
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-4">
        {navigation.map(({ name, href, Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href ||
                pathname.startsWith(`${href}/`);

          return (
           <Link
                key={name}
                href={href}
                className={`flex min-h-14 items-center justify-start gap-3 rounded-full px-4 py-3 text-base font-bold transition-colors ${
                  active
                    ? "bg-white text-[#365f68]"
                    : "text-white hover:bg-[#668d98]"
                }`}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={2}
                />
                <span className="min-w-0 whitespace-normal leading-tight">
                  {name}
                </span>
              </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <UserProfile name="Inventory User" role="Employee" />

    </aside>
  );
}
