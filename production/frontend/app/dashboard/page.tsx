
"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ProductionOrder = {
  Production_ID: number;
  PM_ID: number;
  WH_ID: number;
  QuantityRequired: number;
  QuantityProduced: number;
  StartDate: string;
  Deadline: string;
  status: string;
};

type PanelId =
  | "production-monitoring"
  | "deadlines"
  | "recent-orders"
  | "quick-actions";

const panelOptions: {
  id: PanelId;
  title: string;
  description: string;
}[] = [
  {
    id: "production-monitoring",
    title: "Production Monitoring",
    description: "Monitor and update manufactured quantities.",
  },
  {
    id: "deadlines",
    title: "Upcoming Deadlines",
    description: "Monitor upcoming and overdue production orders.",
  },
  {
    id: "recent-orders",
    title: "Recent Production Orders",
    description: "View your five latest production orders.",
  },
  {
    id: "quick-actions",
    title: "Quick Actions",
    description: "Shortcuts to frequently used pages.",
  },
];

export default function Home() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [draftValues, setDraftValues] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activePanels, setActivePanels] = useState<PanelId[]>([
    "production-monitoring",
    "deadlines",
  ]);

  const [panelMenuOpen, setPanelMenuOpen] = useState(false);

  // Retrieve production orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/orders/`);

      if (!response.ok) {
        throw new Error("Failed to retrieve production orders.");
      }

      const data: ProductionOrder[] = await response.json();

      setOrders(data);

      // Initialize inputs using the latest database quantities
      setDraftValues((previous) => {
        const updated = { ...previous };

        data.forEach((order) => {
          if (!(order.Production_ID in updated)) {
            updated[order.Production_ID] =
              String(order.QuantityProduced);
          }
        });

        return updated;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update production progress through PATCH
  const updateProgress = async (order: ProductionOrder) => {
    const quantity = Number(draftValues[order.Production_ID]);

    if (
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > order.QuantityRequired
    ) {
      setError(
        `Enter a whole number between 0 and ${order.QuantityRequired}.`
      );
      return;
    }

    try {
      setUpdatingId(order.Production_ID);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/orders/${order.Production_ID}/progress`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            QuantityProduced: quantity,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Failed to update production progress."
        );
      }

      setMessage(
        `Production order #${order.Production_ID} updated successfully.`
      );

      await fetchOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Production statistics
  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const ongoingOrders = orders.filter(
    (order) => order.status === "Ongoing"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "Completed"
  ).length;

  const summaryCards = [
    { title: "Total Orders", value: totalOrders },
    { title: "Pending", value: pendingOrders },
    { title: "Ongoing", value: ongoingOrders },
    { title: "Completed", value: completedOrders },
  ];

  const togglePanel = (panel: PanelId) => {
    setActivePanels((current) =>
      current.includes(panel)
        ? current.filter((item) => item !== panel)
        : [...current, panel]
    );
  };

  const upcomingOrders = [...orders]
  .filter(
    (order) => order.status?.toLowerCase() !== "completed"
  )
  .sort((a, b) => b.Production_ID - a.Production_ID)
  .filter(
    (order, index, array) =>
      array.findIndex((item) => item.PM_ID === order.PM_ID) === index
  )
  .sort(
    (a, b) =>
      new Date(a.Deadline).getTime() -
      new Date(b.Deadline).getTime()
  )
  .slice(0, 5);

  const recentOrders = [...orders]
    .sort((a, b) => b.Production_ID - a.Production_ID)
    .slice(0, 5);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "ongoing":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const isOverdue = (deadline: string) =>
    new Date(deadline).getTime() < Date.now();

  return (
    <div className="p-6 space-y-6">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Production Dashboard
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Overview of your production operations.
        </p>
      </div>

      {/* LOADING AND ERROR */}
      {loading ? (
        <p className="text-gray-500 py-8 text-center">
          Loading dashboard...
        </p>
      ) : error && orders.length === 0 ? (
        <p className="text-red-500 py-8 text-center">
          {error}
        </p>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm"
              >
                <p className="text-sm text-gray-500">
                  {card.title}
                </p>

                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {card.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* ERROR AND SUCCESS MESSAGES */}
          {error && (
            <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 rounded-lg bg-green-100 text-green-700 text-sm">
              {message}
            </div>
          )}

          {/* CUSTOM DASHBOARD PANELS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {/* PRODUCTION MONITORING */}
            {activePanels.includes("production-monitoring") && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 xl:col-span-2">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  Production Progress Monitor
                </h2>

                <p className="text-sm text-gray-500 mb-5">
                  Update the cumulative quantity produced for each order.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="p-3">Production ID</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3 min-w-40">Progress</th>
                        <th className="p-3">Remaining</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Update Produced</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-8 text-center text-gray-400"
                          >
                            No production orders found.
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => {
                          const progress =
                            (order.QuantityProduced /
                              order.QuantityRequired) *
                            100;

                          const remaining =
                            order.QuantityRequired -
                            order.QuantityProduced;

                          return (
                            <tr
                              key={order.Production_ID}
                              className="border-b border-gray-100"
                            >
                              <td className="px-3 py-4 font-medium text-gray-700">
                                #{order.Production_ID}
                              </td>

                              <td className="px-3 py-4 text-gray-700">
                                PM #{order.PM_ID}
                              </td>

                              <td className="px-3 py-4 text-gray-700">
                                {order.QuantityProduced} /{" "}
                                {order.QuantityRequired}
                              </td>

                              <td className="px-3 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-[#668d98] h-2 rounded-full"
                                      style={{
                                        width: `${progress}%`,
                                      }}
                                    />
                                  </div>

                                  <span className="text-xs text-gray-600">
                                    {progress.toFixed(1)}%
                                  </span>
                                </div>
                              </td>

                              <td className="px-3 py-4 text-gray-700">
                                {remaining}
                              </td>

                              <td className="px-3 py-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.status)}`}
                                >
                                  {order.status}
                                </span>
                              </td>

                              <td className="px-3 py-4">
                                <input
                                  type="number"
                                  min="0"
                                  max={order.QuantityRequired}
                                  step="1"
                                  value={
                                    draftValues[order.Production_ID] ?? ""
                                  }
                                  onChange={(event) =>
                                    setDraftValues((previous) => ({
                                      ...previous,
                                      [order.Production_ID]:
                                        event.target.value,
                                    }))
                                  }
                                  className="w-24 px-2 py-2 border border-gray-300 rounded-lg text-gray-700"
                                />
                              </td>

                              <td className="px-3 py-4">
                                <button
                                  onClick={() => updateProgress(order)}
                                  disabled={
                                    updatingId !== null || loading
                                  }
                                  className="px-3 py-2 rounded-lg bg-[#365f68] text-white text-xs hover:bg-[#294b53] disabled:opacity-50"
                                >
                                  {updatingId === order.Production_ID
                                    ? "Saving..."
                                    : "Update"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* UPCOMING DEADLINES */}
            {activePanels.includes("deadlines") && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  Upcoming Production Deadlines
                </h2>

                <p className="text-sm text-gray-500 mb-5">
                  Production orders that need attention.
                </p>

                {upcomingOrders.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingOrders.map((order) => (
                      <div
                        key={order.Production_ID}
                        className="flex justify-between items-center gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm">
                            Production #{order.Production_ID}
                          </p>

                          <p className="text-sm text-gray-600">
                            PM #{order.PM_ID}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            Deadline: {formatDate(order.Deadline)}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isOverdue(order.Deadline) ? (
                            <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              Overdue
                            </span>
                          ) : (
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              Upcoming
                            </span>
                          )}

                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">
                    No pending production deadlines.
                  </p>
                )}
              </div>
            )}

            {/* RECENT PRODUCTION ORDERS */}
            {activePanels.includes("recent-orders") && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  Recent Production Orders
                </h2>

                <p className="text-sm text-gray-500 mb-5">
                  Your five latest production orders.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentOrders.map((order) => (
                        <tr
                          key={order.Production_ID}
                          className="border-b border-gray-100"
                        >
                          <td className="p-3">
                            #{order.Production_ID}
                          </td>

                          <td className="p-3">
                            PM #{order.PM_ID}
                          </td>

                          <td className="p-3">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(order.status)}`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* QUICK ACTIONS */}
            {activePanels.includes("quick-actions") && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  Quick Actions
                </h2>

                <p className="text-sm text-gray-500 mb-5">
                  Quickly navigate to production functions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="/orders"
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <p className="font-medium text-gray-800">
                      Production Orders
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      View and manage orders
                    </p>
                  </a>

                  <a
                    href="/requests"
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <p className="font-medium text-gray-800">
                      Material Requests
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      View material requirements
                    </p>
                  </a>

                  <a
                    href="/reports"
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <p className="font-medium text-gray-800">
                      Production Reports
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Review production performance
                    </p>
                  </a>
                </div>
              </div>
            )}

          </div>
        </>
      )}

      {/* DARK OVERLAY */}
      <div
        onClick={() => setPanelMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          panelMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* PANEL SELECTOR */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border border-gray-200 p-5 transition-all duration-300 ${
          panelMenuOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-5 scale-95 pointer-events-none"
        }`}
      >
        <h2 className="text-lg font-semibold text-gray-800">
          Customize Dashboard
        </h2>

        <p className="text-sm text-gray-500 mt-1 mb-4">
          Add or remove dashboard panels.
        </p>

        <div className="space-y-3">
          {panelOptions.map((panel) => {
            const isActive = activePanels.includes(panel.id);

            return (
              <button
                key={panel.id}
                onClick={() => togglePanel(panel.id)}
                className="w-full flex items-center justify-between gap-3 text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {panel.title}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {panel.description}
                  </p>
                </div>

                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${
                    isActive
                      ? "bg-[#365f68] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {isActive ? "Added" : "Add"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FLOATING ADD / CLOSE BUTTON */}
      <button
        onClick={() => setPanelMenuOpen((current) => !current)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#365f68] text-white shadow-xl flex items-center justify-center hover:bg-[#294b53] transition-all duration-300 ${
          panelMenuOpen ? "rotate-45" : "rotate-0"
        }`}
        aria-label={
          panelMenuOpen ? "Close panel selector" : "Add dashboard panel"
        }
      >
        <span className="text-3xl font-light leading-none">
          +
        </span>
      </button>

    </div>
  );
}
