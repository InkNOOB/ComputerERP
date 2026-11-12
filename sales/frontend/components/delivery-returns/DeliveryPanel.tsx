
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  customerAPI,
  deliveryAPI,
  salesOrderAPI,
} from "../../lib/api";

import type { Customer } from "../../types/customer";
import type {
  Delivery,
  DeliveryCreate,
  DeliveryStatus,
  Warehouse,
} from "../../types/delivery";
import type { SalesOrder } from "../../types/order";

const statuses: DeliveryStatus[] = [
  "Pending",
  "Preparing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const formatDate = (date: string | null) => {
  if (!date) return "—";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-PH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const statusStyles: Record<DeliveryStatus, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Preparing: "border-blue-200 bg-blue-50 text-blue-700",
  Shipped: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Delivered: "border-green-200 bg-green-50 text-green-700",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
};

export default function DeliveryPanel() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        deliveryData,
        orderData,
        customerData,
        warehouseData,
      ] = await Promise.all([
        deliveryAPI.getAll(),
        salesOrderAPI.getAll(),
        customerAPI.getAll(),
        deliveryAPI.getWarehouses(),
      ]);

      setDeliveries(deliveryData);
      setOrders(orderData);
      setCustomers(customerData);
      setWarehouses(warehouseData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load delivery information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  const warehouseMap = useMemo(
    () =>
      new Map(
        warehouses.map((warehouse) => [
          warehouse.WH_ID,
          warehouse.Warehouse_Name,
        ])
      ),
    [warehouses]
  );

  const orderMap = useMemo(
    () => new Map(orders.map((order) => [order.order_id, order])),
    [orders]
  );

  const filteredDeliveries = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return deliveries;

    return deliveries.filter((delivery) => {
      const order = orderMap.get(delivery.order_id);
      const customerName = order
        ? customerMap.get(order.customer_id) ?? ""
        : "";

      const warehouseName =
        warehouseMap.get(delivery.WH_ID) ?? "";

      return (
        String(delivery.delivery_id).includes(term) ||
        String(delivery.order_id).includes(term) ||
        customerName.toLowerCase().includes(term) ||
        warehouseName.toLowerCase().includes(term) ||
        delivery.status.toLowerCase().includes(term) ||
        delivery.delivery_address.toLowerCase().includes(term)
      );
    });
  }, [
    deliveries,
    search,
    orderMap,
    customerMap,
    warehouseMap,
  ]);

  const pendingCount = deliveries.filter(
    (delivery) => delivery.status === "Pending"
  ).length;

  const deliveredCount = deliveries.filter(
    (delivery) => delivery.status === "Delivered"
  ).length;

  function resetForm() {
    setOrderId("");
    setWarehouseId("");
    setDeliveryDate("");
    setDeliveryAddress("");
    setShowForm(false);
  }

  async function handleCreateDelivery() {
    setError("");

    if (!orderId || !warehouseId || !deliveryAddress.trim()) {
      setError("Please complete all required delivery fields.");
      return;
    }

    const data: DeliveryCreate = {
      order_id: Number(orderId),
      WH_ID: Number(warehouseId),
      delivery_date: deliveryDate || null,
      delivery_address: deliveryAddress.trim(),
    };

    setSaving(true);

    try {
      await deliveryAPI.create(data);
      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create delivery."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    delivery: Delivery,
    newStatus: DeliveryStatus
  ) {
    if (
      delivery.status === newStatus ||
      updatingId !== null
    ) {
      return;
    }

    setError("");
    setUpdatingId(delivery.delivery_id);

    try {
      const updated = await deliveryAPI.updateStatus(
        delivery.delivery_id,
        newStatus
      );

      setDeliveries((current) =>
        current.map((item) =>
          item.delivery_id === updated.delivery_id
            ? updated
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update delivery status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Deliveries"
          value={deliveries.length.toString()}
        />

        <SummaryCard
          title="Pending Deliveries"
          value={pendingCount.toString()}
          valueStyle="text-amber-600"
        />

        <SummaryCard
          title="Delivered"
          value={deliveredCount.toString()}
          valueStyle="text-green-600"
        />
      </section>

      {/* Delivery Records */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-800">
              Delivery Records
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Track and update delivery progress.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800"
          >
            + Create Delivery
          </button>
        </div>

        <div className="p-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search delivery, order, customer, warehouse, or status..."
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="whitespace-nowrap px-5 py-3 text-center">
                  Delivery No.
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-center">
                  Order No.
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-center">
                  Customer
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-center">
                  Warehouse
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-center">
                  Delivery Date
                </th>
                <th className="px-5 py-3 text-center">
                  Address
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
                    colSpan={7}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Loading deliveries...
                  </td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No delivery records found.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => {
                  const order = orderMap.get(delivery.order_id);

                  return (
                    <tr
                      key={delivery.delivery_id}
                      className="transition-colors hover:bg-slate-50 text-center"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                        DEL-{String(delivery.delivery_id).padStart(4, "0")}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-center text-slate-600">
                        SO-{String(delivery.order_id).padStart(4, "0")}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {order
                          ? customerMap.get(order.customer_id) ??
                            `Customer #${order.customer_id}`
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {warehouseMap.get(delivery.WH_ID) ??
                          `Warehouse #${delivery.WH_ID}`}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(delivery.delivery_date)}
                      </td>

                      <td
                        className="max-w-xs truncate px-5 py-4 text-slate-600"
                        title={delivery.delivery_address}
                      >
                        {delivery.delivery_address || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={delivery.status}
                            disabled={updatingId === delivery.delivery_id}
                            onChange={(e) =>
                              void handleStatusChange(
                                delivery,
                                e.target.value as DeliveryStatus
                              )
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none disabled:cursor-wait disabled:opacity-60 ${
                              statusStyles[delivery.status]
                            }`}
                            aria-label={`Status for delivery ${delivery.delivery_id}`}
                          >
                            {statuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>

                          {updatingId === delivery.delivery_id && (
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

        {!loading && (
          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            Showing {filteredDeliveries.length} of {deliveries.length} deliveries
          </div>
        )}
      </section>

      {/* Create Delivery Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Delivery
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Assign a sales order to a warehouse.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Sales Order
                </label>

                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-600"
                >
                  <option value="">Select sales order</option>

                  {orders
                    .filter((order) => order.status !== "Cancelled")
                    .map((order) => (
                      <option
                        key={order.order_id}
                        value={order.order_id}
                      >
                        SO-{String(order.order_id).padStart(4, "0")} —{" "}
                        {customerMap.get(order.customer_id) ??
                          `Customer #${order.customer_id}`}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Warehouse
                </label>

                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-600"
                >
                  <option value="">Select warehouse</option>

                  {warehouses.map((warehouse) => (
                    <option
                      key={warehouse.WH_ID}
                      value={warehouse.WH_ID}
                    >
                      {warehouse.Warehouse_Name}
                      {warehouse.Location
                        ? ` — ${warehouse.Location}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Delivery Date
                </label>

                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Delivery Address
                </label>

                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  placeholder="Enter complete delivery address"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-green-600"
                />
              </div>

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
                  onClick={() => void handleCreateDelivery()}
                  disabled={saving}
                  className="rounded-lg bg-green-700 px-5 py-3 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Delivery"}
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
  valueStyle = "text-slate-900",
}: {
  title: string;
  value: string;
  valueStyle?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${valueStyle}`}>
        {value}
      </p>
    </div>
  );
}
