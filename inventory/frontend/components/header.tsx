
"use client";

interface HeaderProps {
  pageTitle?: string;
  userName?: string;
  userRole?: string;
}

export default function Header({
  pageTitle = "Dashboard",
  userName = "Inventory User",
  userRole = "Employee",
}: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE7EA] bg-white px-6 py-4 md:px-10">
      {/* System title and page context */}
      <div>
        <h1 className="text-lg font-bold text-[#1F3338]">
          Inventory Control
        </h1>
        <p className="text-sm text-[#587176]">
          {pageTitle}
        </p>
      </div>

      {/* Logged-in user */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9EFE5] font-semibold text-[#173D32]">
          {userName.charAt(0).toUpperCase()}
        </div>

        <div>
          <p className="text-sm font-semibold text-[#1F3338]">
            {userName}
          </p>
          <p className="text-xs text-[#587176]">
            {userRole}
          </p>
        </div>
      </div>
    </header>
  );
}
