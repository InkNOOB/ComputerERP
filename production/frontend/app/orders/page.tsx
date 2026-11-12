
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

type OrderForm = {
  PM_ID: string;
  WH_ID: string;
  QuantityRequired: string;
  StartDate: string;
  Deadline: string;
};

const initialForm: OrderForm = {
  PM_ID: "",
  WH_ID: "",
  QuantityRequired: "",
  StartDate: "",
  Deadline: "",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OrderForm>(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update form fields
  const handleChange = (
    field: keyof OrderForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Register a production order
  const createOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          PM_ID: Number(form.PM_ID),
          WH_ID: Number(form.WH_ID),
          QuantityRequired: Number(form.QuantityRequired),
          StartDate: form.StartDate,
          Deadline: form.Deadline,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Failed to create production order."
        );
      }

      setMessage("Production order created successfully.");
      setForm(initialForm);

      await fetchOrders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Ongoing":
        return "bg-blue-100 text-blue-700";
      case "Pending":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="p-6 space-y-6">

      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Production Order Management
        </h1>
        <p className="text-sm text-gray-500">
          Create and manage production orders.
        </p>
      </div>

      {/* Error and Success Messages */}
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

      {/* Add Production Order */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">

        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">
            Add Production Order
          </h2>
          <p className="text-sm text-gray-500">
            Enter the required production order details.
          </p>
        </div>

        <form onSubmit={createOrder} className="p-5 space-y-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Product Master ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PM_ID
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.PM_ID}
                onChange={(e) => handleChange("PM_ID", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#668d98]"
                placeholder="Enter Product Master ID"
              />
            </div>

            {/* Warehouse ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WH_ID
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.WH_ID}
                onChange={(e) => handleChange("WH_ID", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#668d98]"
                placeholder="Enter Warehouse ID"
              />
            </div>

            {/* Required Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Required
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.QuantityRequired}
                onChange={(e) =>
                  handleChange("QuantityRequired", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#668d98]"
                placeholder="Enter required quantity"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="datetime-local"
                required
                value={form.StartDate}
                onChange={(e) => handleChange("StartDate", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#668d98]"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <input
                type="datetime-local"
                required
                min={form.StartDate || undefined}
                value={form.Deadline}
                onChange={(e) => handleChange("Deadline", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#668d98]"
              />
            </div>

          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#365f68] text-white text-sm font-medium hover:bg-[#294b53] disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Add Production Order"}
            </button>
          </div>

        </form>
      </div>

      {/* Existing Production Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">

        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">
            Production Orders
          </h2>
          <p className="text-sm text-gray-500">
            View your registered production orders.
          </p>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-3">Production ID</th>
                <th className="px-5 py-3">PM_ID</th>
                <th className="px-5 py-3">WH_ID</th>
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Start Date</th>
                <th className="px-5 py-3">Deadline</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    Loading production orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    No production orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.Production_ID} className="hover:bg-gray-50">

                    <td className="px-5 py-3 font-semibold text-gray-700">
                      #{order.Production_ID}
                    </td>

                    <td className="px-5 py-3">
                      PM #{order.PM_ID}
                    </td>

                    <td className="px-5 py-3">
                      WH #{order.WH_ID}
                    </td>

                    <td className="px-5 py-3">
                      {order.QuantityProduced} / {order.QuantityRequired}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap">
                      {new Date(order.StartDate).toLocaleString()}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap">
                      {new Date(order.Deadline).toLocaleString()}
                    </td>

                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>

        </div>
      </div>

    </div>
  );
}