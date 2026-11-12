
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

const PAGE_SIZE = 10;

const statuses: SalesOrderStatus[] = [
  "Pending",
  "Approved",
  "Processing",
  "Completed",
  "Cancelled",
];

const money = (amount: string | number) =>
  `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-PH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const statusStyles: Record<SalesOrderStatus, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-blue-200 bg-blue-50 text-blue-700",
  Processing: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Completed: "border-green-200 bg-green-50 text-green-700",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<SalesOrderItem[]>([]);

  const [search, setSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
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
        err instanceof Error
          ? err.message
          : "Unable to load sales orders."
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
        err instanceof Error
          ? err.message
          : "Unable to load customers."
      );
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);

    try {
      const data = await salesOrderAPI.getItems(itemSearch);
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load items."
      );
    } finally {
      setLoadingItems(false);
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
    () =>
      new Map(
        customers.map((customer) => [
          customer.customer_id,
          customer.name,
        ])
      ),
    [customers]
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / PAGE_SIZE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;

    return filteredOrders.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );
  }, [filteredOrders, safePage]);

  const totalSales = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "Completed"
  ).length;

  const startRecord =
    filteredOrders.length === 0
      ? 0
      : (safePage - 1) * PAGE_SIZE + 1;

  const endRecord = Math.min(
    safePage * PAGE_SIZE,
    filteredOrders.length
  );

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
          !Number.isInteger(line.quantity) ||
          line.quantity <= 0 ||
          !Number.isFinite(line.discount) ||
          line.discount < 0 ||
          line.discount > 100
      )
    ) {
      setError(
        "Please select valid items, whole-number quantities, and discounts between 0 and 100."
      );
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
      setCurrentPage(1);
      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create sales order."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    order: SalesOrder,
    newStatus: SalesOrderStatus
  ) {
    if (order.status === newStatus) return;

    setError("");
    setUpdatingOrderId(order.order_id);

    try {
      const updated = await salesOrderAPI.updateStatus(
        order.order_id,
        newStatus
      );

      setOrders((current) =>
        current.map((item) =>
          item.order_id === updated.order_id ? updated : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <div className="min-h-full space-y-5 text-slate-800">
      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="font-semibold hover:text-red-900"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Orders"
          value={orders.length.toString()}
        />

        <SummaryCard
          title="Total Sales"
          value={money(totalSales)}
        />

        <SummaryCard
          title="Pending Orders"
          value={pendingOrders.toString()}
          valueColor="text-amber-600"
        />

        <SummaryCard
          title="Completed Orders"
          value={completedOrders.toString()}
          valueColor="text-green-700"
        />
      </section>

      {/* Sales Order List */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-800">
              Sales Order List
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View and update your sales orders.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search order, customer, or status..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100 sm:w-72"
            />

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowForm(true);
              }}
              className="whitespace-nowrap rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              + Create Sales Order
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="whitespace-nowrap text-center px-5 py-3">
                  Order No.
                </th>
                <th className="whitespace-nowrap px-5 py-3">
                  Customer
                </th>
                <th className="whitespace-nowrap text-center px-5 py-3">
                  Order Date
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-center">
                  Items
                </th>
                <th className="whitespace-nowrap px-5 py-3">
                  Total Amount
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-center">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Loading sales orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    {search
                      ? "No sales orders match your search."
                      : "No sales orders found."}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isUpdating =
                    updatingOrderId === order.order_id;

                  return (
                    <tr
                      key={order.order_id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap text-center px-5 py-4 font-semibold text-slate-800">
                        SO-{String(order.order_id).padStart(4, "0")}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {customerMap.get(order.customer_id) ??
                          `Customer #${order.customer_id}`}
                      </td>

                      <td className="whitespace-nowrap text-center px-5 py-4 text-slate-600">
                        {formatDate(order.order_date)}
                      </td>

                      <td className="px-5 py-4 text-center text-slate-600">
                        {order.details?.length ?? 0}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                        {money(order.total_amount)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2 items-center">
                          <select
                            value={order.status}
                            disabled={isUpdating}
                            onChange={(e) =>
                              void handleStatusChange(
                                order,
                                e.target.value as SalesOrderStatus
                              )
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition disabled:cursor-wait disabled:opacity-60 ${
                              statusStyles[order.status]
                            }`}
                            aria-label={`Update status for order ${order.order_id}`}
                          >
                            {statuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>

                          {isUpdating && (
                            <span className="text-xs text-slate-500">
                              Saving...
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredOrders.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {startRecord}–{endRecord}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {filteredOrders.length}
              </span>{" "}
              orders
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={safePage === 1}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="min-w-20 text-center text-sm text-slate-600">
                Page {safePage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Create Sales Order Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Sales Order
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select a customer and add the items for this order.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              {/* Customer */}
              <div>
                <label
                  htmlFor="order-customer"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Customer
                </label>

                <select
                  id="order-customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-600"
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

              {/* Order Items */}
              <div>
                <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <label className="text-sm font-medium text-slate-700">
                    Order Items
                  </label>

                  <input
                    type="search"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search items..."
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-green-600"
                  />
                </div>

                {loadingItems && (
                  <p className="mb-2 text-xs text-slate-500">
                    Loading items...
                  </p>
                )}

                <div className="space-y-3">
                  {lines.map((line, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_90px_100px_auto]"
                    >
                      <select
                        value={line.IM_ID || ""}
                        onChange={(e) =>
                          updateLine(index, {
                            IM_ID: Number(e.target.value),
                          })
                        }
                        disabled={saving}
                        className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
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
                        step="1"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(index, {
                            quantity:
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value),
                          })
                        }
                        disabled={saving}
                        aria-label="Quantity"
                        placeholder="Qty"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                      />

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={line.discount}
                        onChange={(e) =>
                          updateLine(index, {
                            discount:
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value),
                          })
                        }
                        disabled={saving}
                        aria-label="Discount percentage"
                        placeholder="Discount %"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                      />

                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        disabled={lines.length === 1 || saving}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {!loadingItems && items.length === 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    No items found. Try a different search.
                  </p>
                )}

                <button
                  type="button"
                  onClick={addLine}
                  disabled={saving}
                  className="mt-3 text-sm font-semibold text-green-700 hover:text-green-800 disabled:opacity-50"
                >
                  + Add another item
                </button>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleCreateOrder()}
                  disabled={saving}
                  className="rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  valueColor = "text-slate-900",
}: {
  title: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}
