
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

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH");
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    if (delivery.status === newStatus) return;

    setError("");

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
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-medium text-gray-500">
            Sales Module / Delivery
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Delivery Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Track the preparation, dispatch, and delivery of sales orders.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700"
            >
              + Create Delivery
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

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Deliveries</p>
            <p className="mt-2 text-2xl font-semibold">
              {deliveries.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Pending Deliveries</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              {deliveredCount}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-5">
            <h2 className="font-semibold">Delivery List</h2>
            <p className="mt-1 text-sm text-gray-500">
              View and update your delivery records.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Delivery No.</th>
                  <th className="px-5 py-4 font-medium">Order No.</th>
                  <th className="px-5 py-4 font-medium">Customer</th>
                  <th className="px-5 py-4 font-medium">Warehouse</th>
                  <th className="px-5 py-4 font-medium">Delivery Date</th>
                  <th className="px-5 py-4 font-medium">Address</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      Loading deliveries...
                    </td>
                  </tr>
                ) : deliveries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      No deliveries found.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((delivery) => {
                    const order = orderMap.get(delivery.order_id);

                    return (
                      <tr
                        key={delivery.delivery_id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 font-medium">
                          DEL-{String(delivery.delivery_id).padStart(4, "0")}
                        </td>

                        <td className="px-5 py-4">
                          SO-{String(delivery.order_id).padStart(4, "0")}
                        </td>

                        <td className="px-5 py-4">
                          {order
                            ? customerMap.get(order.customer_id) ??
                              `Customer #${order.customer_id}`
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          {warehouseMap.get(delivery.WH_ID) ??
                            `Warehouse #${delivery.WH_ID}`}
                        </td>

                        <td className="px-5 py-4">
                          {formatDate(delivery.delivery_date)}
                        </td>

                        <td className="max-w-xs truncate px-5 py-4">
                          {delivery.delivery_address}
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={delivery.status}
                            onChange={(e) =>
                              void handleStatusChange(
                                delivery,
                                e.target.value as DeliveryStatus
                              )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none focus:border-gray-900"
                            aria-label={`Status for delivery ${delivery.delivery_id}`}
                          >
                            {statuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Create Delivery</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Assign a sales order to a warehouse.
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
                  Sales Order
                </label>

                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
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
                <label className="mb-2 block text-sm font-medium">
                  Warehouse
                </label>

                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
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
                <label className="mb-2 block text-sm font-medium">
                  Delivery Date
                </label>

                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Delivery Address
                </label>

                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  placeholder="Enter complete delivery address"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                />
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
                  onClick={() => void handleCreateDelivery()}
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Delivery"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
