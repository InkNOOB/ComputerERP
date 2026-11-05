
import type { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function DashboardLayout({
  children,
  title = "Dashboard",
  description,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#8FB1B8] p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-[1600px] gap-5">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Workspace */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] bg-white shadow-sm">
          {/* Header */}
          <Header pageTitle={title} />

          {/* Page Content */}
          <section className="flex-1 p-5 md:p-8">
            {description && (
              <p className="mb-5 text-sm text-[#587176]">
                {description}
              </p>
            )}

            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
