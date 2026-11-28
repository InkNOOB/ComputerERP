
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ClipboardList,
  ArrowLeftRight,
  BookOpenText,
  LogOut,
} from "lucide-react";
import UserProfile from "./userprofile";

const navigation = [
  { name: "Dashboard", href: "/", Icon: LayoutDashboard },
  { name: "Item Master", href: "/items", Icon: Package },
  { name: "Warehouse", href: "/warehouses", Icon: Warehouse },
  { name: "Orders", href: "/orders", Icon: ClipboardList },
  { name: "Stock Actions", href: "/stock_actions", Icon: ArrowLeftRight },
  { name: "Stock Ledger", href: "/stock_ledger", Icon: BookOpenText },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();

  

  function handleLogout() {
    // Clear the Inventory session token
    sessionStorage.removeItem("erp_token");

    // Return to the centralized login page
    window.location.replace("https://computer-erp-login.vercel.app");
  }

  return (
      <>
    {/* Mobile Overlay */}
{mobileOpen && (
  <div
    className="fixed inset-0 z-40 bg-black/40 md:hidden"
    onClick={() => setMobileOpen(false)}
  />
)}

<aside
  onMouseEnter={() => {
    if (window.innerWidth >= 768) setCollapsed(false);
  }}
  onMouseLeave={() => {
    if (window.innerWidth >= 768) setCollapsed(true);
  }}
  className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[220px] flex-col overflow-y-auto rounded-r-[24px] bg-[#365f68] p-3 text-white shadow-xl transition-[width,transform] duration-300 ease-in-out
    md:inset-y-6 md:left-6 md:h-[calc(100vh-48px)]
${mobileOpen
  ? "md:w-[220px]"
  : collapsed
    ? "md:w-[80px]"
    : "md:w-[220px]"
}    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0 md:rounded-[24px]
  `}
>

{/* Department Header */}
<div className="mb-5 flex min-h-[56px] items-center gap-2 px-2 py-3">  
  
  {/* Logo and Inventory Name */}
  <div
    className={`flex min-w-0 flex-1 items-center transition-all duration-300 ${
      collapsed && !mobileOpen
  ? "justify-center"
  : "justify-start gap-0"
    }`}
  >
   <Image
  src="/image/logo.png"
  alt="ComputerERP Logo"
  width={50}
  height={50}
  style={{
    width: "72px",
    height: "auto",
  }}
  className="shrink-20 object-contain transition-all duration-300"
/>

    {(!collapsed || mobileOpen) && (
  <span className="text-sm font-bold tracking-wide">
    INVENTORY
  </span>
)}
  </div>

  {/* Mobile Close Button */}
  <button
  type="button"
  onClick={() => setMobileOpen(false)}
className="ml-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-[#668d98] md:hidden"
  aria-label="Close menu"
>
  ×
</button>

</div>

      {/* Navigation */}
<nav className="flex flex-1 flex-col gap-3 pb-6">
  {navigation.map(({ name, href, Icon }) => {
    const active =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        key={name}
        href={href}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? name : ""}
        className={`flex min-h-12 w-full items-center justify-start gap-3 rounded-full px-4 py-3 text-sm font-bold transition-colors ${
  active
    ? "bg-white text-[#365f68]"
    : "text-white hover:bg-[#668d98]"
}`}
      >
        <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />

        {(!collapsed || mobileOpen) && (
  <span className="min-w-0 leading-tight">
    {name}
  </span>
)}
      </Link>
    );
  })}
</nav>

{/* User Profile */}
<div className="relative z-10 w-full shrink-0">
  {(!collapsed || mobileOpen) && (
    <UserProfile
      name="Inventory User"
      role="Employee"
    />
  )}
</div>

{/* Logout Button */}
<button
  type="button"
  onClick={handleLogout}
  title={collapsed ? "Logout" : ""}
  className={`mt-3 flex min-h-12 w-full items-center rounded-full py-3 text-sm font-bold text-white transition-colors hover:bg-[#668d98] ${
    collapsed && !mobileOpen
  ? "justify-center px-2"
  : "gap-3 px-4"
  }`}
>
  <LogOut className="h-5 w-5 shrink-0" />
{(!collapsed || mobileOpen) && <span>Logout</span>}
</button>

    </aside>
      </>
  );
}
