
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { customerAPI, salesOrderAPI } from "../../lib/api";
import type { Customer } from "../../types/customer";
import type {
  SalesOrder,
  SalesOrderCreate,
  SalesOrderItem,
  SalesOrderStatus,
} from "../../types/order";

interface OrderLine {
  IM_ID: number;
  quantity: number;
  discount: number;
}

const statuses: SalesOrderStatus[] = [
  "Pending",
  "Approved",
  "Processing",
  "Completed",
  "Cancelled",
];

const money = (amount: string | number) =>
  `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function OrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<SalesOrderItem[]>([]);

  const [search, setSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([
    { IM_ID: 0, quantity: 1, discount: 0 },
  ]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await salesOrderAPI.getAll();
      setOrders(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load sales orders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await customerAPI.getAll();
      setCustomers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load customers."
      );
    }
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const data = await salesOrderAPI.getItems(itemSearch);
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load items."
      );
    }
  }, [itemSearch]);

  useEffect(() => {
    void loadOrders();
    void loadCustomers();
  }, [loadOrders, loadCustomers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadItems();
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadItems]);

  const customerMap = useMemo(
    () => new Map(customers.map((customer) => [customer.customer_id, customer.name])),
    [customers]
  );

  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.IM_ID, item])),
    [items]
  );

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return orders;

    return orders.filter((order) => {
      const customerName =
        customerMap.get(order.customer_id) ?? "";

      return (
        String(order.order_id).includes(term) ||
        customerName.toLowerCase().includes(term) ||
        order.status.toLowerCase().includes(term)
      );
    });
  }, [orders, search, customerMap]);

  const totalSales = orders.reduce(
    (sum, order) => sum + Number(order.total_amount),
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "Completed"
  ).length;

  function updateLine(index: number, changes: Partial<OrderLine>) {
    setLines((current) =>
      current.map((line, i) =>
        i === index ? { ...line, ...changes } : line
      )
    );
  }

  function addLine() {
    setLines((current) => [
      ...current,
      { IM_ID: 0, quantity: 1, discount: 0 },
    ]);
  }

  function removeLine(index: number) {
    setLines((current) => current.filter((_, i) => i !== index));
  }

  function resetForm() {
    setCustomerId("");
    setLines([{ IM_ID: 0, quantity: 1, discount: 0 }]);
    setItemSearch("");
    setShowForm(false);
  }

  async function handleCreateOrder() {
    setError("");

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (
      lines.length === 0 ||
      lines.some(
        (line) =>
          line.IM_ID <= 0 ||
          line.quantity <= 0 ||
          line.discount < 0 ||
          line.discount > 100
      )
    ) {
      setError("Please select valid items, quantities, and discounts.");
      return;
    }

    const data: SalesOrderCreate = {
      customer_id: Number(customerId),
      details: lines.map((line) => ({
        IM_ID: line.IM_ID,
        quantity: line.quantity,
        discount: line.discount,
      })),
    };

    setSaving(true);

    try {
      await salesOrderAPI.create(data);
      resetForm();
      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create sales order."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    order: SalesOrder,
    status: SalesOrderStatus
  ) {
    if (order.status === status) return;

    setError("");

    try {
      const updated = await salesOrderAPI.updateStatus(
        order.order_id,
        status
      );

      setOrders((current) =>
        current.map((item) =>
          item.order_id === updated.order_id ? updated : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update order status."
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-medium text-gray-500">
            Sales Module / Sales Order
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Sales Orders
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage confirmed orders for computer parts and computer sets.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700"
            >
              + Create Sales Order
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="mt-2 text-2xl font-semibold">{orders.length}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="mt-2 text-2xl font-semibold">{money(totalSales)}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Pending Orders</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">
              {pendingOrders}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Completed Orders</p>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              {completedOrders}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">Sales Order List</h2>
              <p className="mt-1 text-sm text-gray-500">
                View and update your sales orders.
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, customer, or status..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-gray-900 sm:max-w-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Order No.</th>
                  <th className="px-5 py-4 font-medium">Customer</th>
                  <th className="px-5 py-4 font-medium">Order Date</th>
                  <th className="px-5 py-4 font-medium">Items</th>
                  <th className="px-5 py-4 font-medium">Total Amount</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                      Loading sales orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                      No sales orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium">
                        SO-{String(order.order_id).padStart(4, "0")}
                      </td>
                      <td className="px-5 py-4">
                        {customerMap.get(order.customer_id) ??
                          `Customer #${order.customer_id}`}
                      </td>
                      <td className="px-5 py-4">
                        {new Date(order.order_date).toLocaleDateString("en-PH")}
                      </td>
                      <td className="px-5 py-4">{order.details.length}</td>
                      <td className="px-5 py-4 font-medium">
                        {money(order.total_amount)}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            void handleStatusChange(
                              order,
                              e.target.value as SalesOrderStatus
                            )
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none focus:border-gray-900"
                          aria-label={`Status for order ${order.order_id}`}
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Create Sales Order</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select a customer and add the items for this order.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-900"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Customer
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                >
                  <option value="">Select customer</option>
                  {customers
                    .filter((customer) => customer.status)
                    .map((customer) => (
                      <option
                        key={customer.customer_id}
                        value={customer.customer_id}
                      >
                        {customer.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <label className="text-sm font-medium">Order Items</label>
                  <input
                    type="search"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search items..."
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                </div>

                <div className="space-y-3">
                  {lines.map((line, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-[minmax(0,1fr)_90px_100px_auto]"
                    >
                      <select
                        value={line.IM_ID || ""}
                        onChange={(e) =>
                          updateLine(index, {
                            IM_ID: Number(e.target.value),
                          })
                        }
                        className="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Select item</option>
                        {items.map((item) => (
                          <option key={item.IM_ID} value={item.IM_ID}>
                            {item.SKU} - {item.Item_Name} (
                            {money(item.Price ?? 0)})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(index, {
                            quantity: Number(e.target.value),
                          })
                        }
                        aria-label="Quantity"
                        placeholder="Qty"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />

                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={line.discount}
                        onChange={(e) =>
                          updateLine(index, {
                            discount: Number(e.target.value),
                          })
                        }
                        aria-label="Discount percentage"
                        placeholder="Discount %"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />

                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        disabled={lines.length === 1}
                        className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addLine}
                  className="mt-3 text-sm font-medium text-gray-700 hover:text-black"
                >
                  + Add another item
                </button>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleCreateOrder()}
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
