
"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  total_orders: number;
  total_quantity_required: number;
  total_quantity_produced: number;
};

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard/summary")
      .then((response) => response.json())
      .then((data) => setDashboard(data))
      .catch((error) => console.error("Dashboard error:", error));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Production Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-gray-500">Total Orders</h2>
          <p className="text-3xl font-bold">
            {dashboard?.total_orders ?? "Loading..."}
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-gray-500">Quantity Required</h2>
          <p className="text-3xl font-bold">
            {dashboard?.total_quantity_required ?? "Loading..."}
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-gray-500">Quantity Produced</h2>
          <p className="text-3xl font-bold">
            {dashboard?.total_quantity_produced ?? "Loading..."}
          </p>
        </div>
      </div>
    </div>
  );
}