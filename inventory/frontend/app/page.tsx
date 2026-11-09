
"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Link from "next/link";
import DashboardLayout from "../components/dashboardlayout";

type DashboardData = {
  summary: {
    total_items: number;
    raw_materials: number;
    finished_goods: number;
    total_stock: number;
    total_warehouses: number;
    low_stock_count: number;
  };
  low_stock_items: {
    STOCK_ID: number;
    IM_ID: number;
    SKU: string;
    Item_Name: string;
    ItemType: string;
    WH_ID: number;
    Warehouse_Name: string;
    quantity_on_hand: number;
    reorder_level: number;
  }[];
  recent_activities: {
    LogID: number;
    SKU: string | null;
    Item_Name: string | null;
    Warehouse_Name: string | null;
    Target_Warehouse_Name: string | null;
    TransactionType: string;
    Quantity: number;
    ActualQuantity: number | null;
    ReferenceNo: string | null;
    LoggedBy: string | null;
    ApprovedBy: string | null;
    LogDate: string;
    Remarks: string | null;
  }[];
    stock_distribution: {
    item_type: string;
    total_quantity: number;
  }[];
  stock_movement: {
    movement_date: string;
    transaction_type: string;
    total_quantity: number;
  }[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/dashboard/summary`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load dashboard data.");
        }

        const result: DashboardData = await response.json();
        setData(result);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the dashboard."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => controller.abort();
  }, []);

  const summary = data?.summary;

  const stockDistribution = data?.stock_distribution ?? [];

  const stockMovement = data?.stock_movement ?? [];
  const movementChartData = stockMovement.reduce<
    { movement_date: string; [key: string]: string | number }[]
  >((result, movement) => {
    const existing = result.find(
      (item) => item.movement_date === movement.movement_date
    );

    if (existing) {
      existing[movement.transaction_type] = movement.total_quantity;
    } else {
      result.push({
        movement_date: movement.movement_date,
        [movement.transaction_type]: movement.total_quantity,
      });
    }

    return result;
  }, []);

const transactionTypes = Array.from(
  new Set(stockMovement.map((item) => item.transaction_type))
);

  const cards = [
    {
      title: "Total Items",
      value: summary?.total_items ?? 0,
      description: "All registered items",
      href: "/items",
    },
    {
      title: "Raw Materials",
      value: summary?.raw_materials ?? 0,
      description: "Registered raw materials",
      href: "/items?type=Raw",
    },
    {
      title: "Finished Goods",
      value: summary?.finished_goods ?? 0,
      description: "Registered finished goods",
      href: "/items?type=Finished",
    },
    {
      title: "Total Stock",
      value: summary?.total_stock ?? 0,
      description: "Total quantity across warehouses",
      href: "/warehouses",
    },
    {
      title: "Total Warehouses",
      value: summary?.total_warehouses ?? 0,
      description: "Registered warehouses",
      href: "/warehouses",
    },
    {
      title: "Low Stock Items",
      value: summary?.low_stock_count ?? 0,
      description: "Items at or below reorder level",
      href: "/items",
    },
  ];

  function formatDate(date: string) {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <DashboardLayout
      title="Dashboard"
      description="Welcome to the Inventory and Warehouse Management System."
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-2xl border border-[#DCE7EA] bg-[#F2F7F8] p-5 transition hover:-translate-y-1 hover:border-[#24363B] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#587176]">
                {card.title}
              </p>
              <span className="text-sm text-[#587176]">↗</span>
            </div>

            <h2 className="mt-3 text-3xl font-bold text-[#1F3338]">
              {loading ? "..." : card.value.toLocaleString()}
            </h2>

            <p className="mt-2 text-xs text-[#587176]">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Loading and Error Messages */}
      {loading && (
        <div className="mt-6 rounded-2xl border border-[#DCE7EA] bg-white p-5 text-sm text-[#587176]">
          Loading dashboard data...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">
            Dashboard loading failed
          </p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Inventory Overview */}
          <div className="mt-6 rounded-2xl border border-[#DCE7EA] bg-white p-6">
            <h2 className="text-lg font-bold text-[#1F3338]">
              Inventory Overview
            </h2>

            <p className="mt-1 text-sm text-[#587176]">
              Current summary of registered inventory.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="rounded-xl bg-[#F2F7F8] p-4">
                <p className="text-sm text-[#587176]">Raw Materials</p>
                <p className="mt-2 text-2xl font-bold text-[#1F3338]">
                  {summary?.raw_materials ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-[#F2F7F8] p-4">
                <p className="text-sm text-[#587176]">Finished Goods</p>
                <p className="mt-2 text-2xl font-bold text-[#1F3338]">
                  {summary?.finished_goods ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-[#F2F7F8] p-4">
                <p className="text-sm text-[#587176]">Total Stock Quantity</p>
                <p className="mt-2 text-2xl font-bold text-[#1F3338]">
                  {(summary?.total_stock ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

            {/* Dashboard Charts */}
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

              {/* Stock Distribution */}
              <div className="rounded-2xl border border-[#DCE7EA] bg-white p-6">
                <h2 className="text-lg font-bold text-[#1F3338]">
                  Stock Distribution
                </h2>

                <p className="mt-1 text-sm text-[#587176]">
                  Current stock quantity by item type.
                </p>

                {stockDistribution.length > 0 ? (
                  <div className="mt-6 h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stockDistribution}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fill: "#587176", fontSize: 12 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="item_type"
                          tick={{ fill: "#587176", fontSize: 12 }}
                          width={85}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="total_quantity"
                          name="Stock Quantity"
                          fill="#24363B"
                          radius={[0, 5, 5, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-6 flex h-[280px] items-center justify-center text-sm text-[#587176]">
                    No stock distribution data available.
                  </div>
                )}
              </div>

              {/* Stock Movement */}
              <div className="rounded-2xl border border-[#DCE7EA] bg-white p-6">
                <h2 className="text-lg font-bold text-[#1F3338]">
                  Stock Movement
                </h2>

                <p className="mt-1 text-sm text-[#587176]">
                  Recorded stock transactions during the last seven days.
                </p>

                {movementChartData.length > 0 ? (
                  <div className="mt-6 h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={movementChartData}
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="movement_date"
                          tick={{ fill: "#587176", fontSize: 11 }}
                          tickFormatter={(value) =>
                            new Date(value + "T00:00:00").toLocaleDateString(
                              "en-PH",
                              { month: "short", day: "numeric" }
                            )
                          }
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fill: "#587176", fontSize: 12 }}
                        />
                        <Tooltip />
                        <Legend />

                        {transactionTypes.map((type, index) => {
                          const chartColors = [
                            "#24363B",
                            "#4F8585",
                            "#8FB1B8",
                            "#A6A6A6",
                          ];

                          return (
                            <Bar
                              key={type}
                              dataKey={type}
                              name={type}
                              fill={chartColors[index % chartColors.length]}
                              radius={[4, 4, 0, 0]}
                            />
                          );
                        })}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-6 flex h-[280px] items-center justify-center text-sm text-[#587176]">
                    No stock movements recorded in the last seven days.
                  </div>
                )}
              </div>

            </div>

          {/* Low Stock Items */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#DCE7EA] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE7EA] p-6">
              <div>
                <h2 className="text-lg font-bold text-[#1F3338]">
                  Low Stock Items
                </h2>
                <p className="mt-1 text-sm text-[#587176]">
                  Items that have reached or fallen below their reorder level.
                </p>
              </div>

              <Link
                href="/items"
                className="text-sm font-semibold text-[#24363B] hover:underline"
              >
                View Items →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-[#F2F7F8] text-[#587176]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">SKU</th>
                    <th className="px-6 py-4 font-semibold">Item Name</th>
                    <th className="px-6 py-4 font-semibold">Warehouse</th>
                    <th className="px-6 py-4 font-semibold">Current Stock</th>
                    <th className="px-6 py-4 font-semibold">Reorder Level</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#DCE7EA]">
                  {data.low_stock_items.length > 0 ? (
                    data.low_stock_items.map((item) => (
                      <tr key={item.STOCK_ID}>
                        <td className="px-6 py-4 text-[#1F3338]">
                          {item.SKU}
                        </td>
                        <td className="px-6 py-4 font-medium text-[#1F3338]">
                          {item.Item_Name}
                        </td>
                        <td className="px-6 py-4 text-[#587176]">
                          {item.Warehouse_Name}
                        </td>
                        <td className="px-6 py-4 font-semibold text-red-600">
                          {item.quantity_on_hand}
                        </td>
                        <td className="px-6 py-4 text-[#1F3338]">
                          {item.reorder_level}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-[#587176]"
                      >
                        No low-stock items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#DCE7EA] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE7EA] p-6">
              <div>
                <h2 className="text-lg font-bold text-[#1F3338]">
                  Recent Stock Activities
                </h2>
                <p className="mt-1 text-sm text-[#587176]">
                  Latest recorded inventory transactions.
                </p>
              </div>

              <Link
                href="/stock-ledger"
                className="text-sm font-semibold text-[#24363B] hover:underline"
              >
                View Ledger →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-[#F2F7F8] text-[#587176]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Reference No.</th>
                    <th className="px-6 py-4 font-semibold">Item</th>
                    <th className="px-6 py-4 font-semibold">Transaction</th>
                    <th className="px-6 py-4 font-semibold">Quantity</th>
                    <th className="px-6 py-4 font-semibold">Logged By</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#DCE7EA]">
                  {data.recent_activities.length > 0 ? (
                    data.recent_activities.map((activity) => (
                      <tr key={activity.LogID}>
                        <td className="whitespace-nowrap px-6 py-4 text-[#587176]">
                          {formatDate(activity.LogDate)}
                        </td>
                        <td className="px-6 py-4 text-[#1F3338]">
                          {activity.ReferenceNo || "—"}
                        </td>
                        <td className="px-6 py-4 font-medium text-[#1F3338]">
                          {activity.Item_Name || "—"}
                        </td>
                        <td className="px-6 py-4 text-[#587176]">
                          {activity.TransactionType}
                        </td>
                        <td className="px-6 py-4 text-[#1F3338]">
                          {activity.ActualQuantity ?? activity.Quantity}
                        </td>
                        <td className="px-6 py-4 text-[#587176]">
                          {activity.LoggedBy || "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-[#587176]"
                      >
                        No recent stock activities found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
