
import DashboardLayout from "../components/dashboardlayout";

export default function Home() {
  return (
    <DashboardLayout
      title="Dashboard"
      description="Welcome to the Inventory and Warehouse Management System."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#DCE7EA] bg-[#F2F7F8] p-5">
          <p className="text-sm text-[#587176]">Total Items</p>
          <h2 className="mt-3 text-3xl font-bold text-[#1F3338]">0</h2>
        </div>

        <div className="rounded-2xl border border-[#DCE7EA] bg-[#F2F7F8] p-5">
          <p className="text-sm text-[#587176]">Total Warehouses</p>
          <h2 className="mt-3 text-3xl font-bold text-[#1F3338]">0</h2>
        </div>

        <div className="rounded-2xl border border-[#DCE7EA] bg-[#F2F7F8] p-5">
          <p className="text-sm text-[#587176]">Low Stock Items</p>
          <h2 className="mt-3 text-3xl font-bold text-[#1F3338]">0</h2>
        </div>

        <div className="rounded-2xl border border-[#DCE7EA] bg-[#F2F7F8] p-5">
          <p className="text-sm text-[#587176]">Pending Stock Actions</p>
          <h2 className="mt-3 text-3xl font-bold text-[#1F3338]">0</h2>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#DCE7EA] bg-white p-6">
        <h2 className="text-lg font-bold text-[#1F3338]">
          Inventory Overview
        </h2>
        <p className="mt-2 text-sm text-[#587176]">
          Your inventory summary and recent stock activities will appear here.
        </p>
      </div>
    </DashboardLayout>
  );
}
