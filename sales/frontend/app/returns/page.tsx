
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  customerAPI,
  invoiceAPI,
  salesOrderAPI,
  salesReturnAPI,
} from "../../lib/api";

import type { Customer } from "../../types/customer";
import type { SalesInvoice } from "../../types/invoice";
import type { SalesOrder, SalesOrderItem } from "../../types/order";
import type { SalesReturn, SalesReturnCreate } from "../../types/return";

const money = (amount: string | number) =>
  `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ReturnsPage() {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<SalesOrderItem[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [orderDetailId, setOrderDetailId] = useState("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [returnAmount, setReturnAmount] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        returnData,
        orderData,
        invoiceData,
        customerData,
        itemData,
      ] = await Promise.all([
        salesReturnAPI.getAll(),
        salesOrderAPI.getAll(),
        invoiceAPI.getAll(),
        customerAPI.getAll(),
        salesOrderAPI.getItems(),
      ]);

      setReturns(returnData);
      setOrders(orderData);
      setInvoices(invoiceData);
      setCustomers(customerData);
      setItems(itemData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load sales returns."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const orderMap = useMemo(
    () => new Map(orders.map((order) => [order.order_id, order])),
    [orders]
  );

  const customerMap = useMemo(
    () => new Map(customers.map((customer) => [customer.customer_id, customer])),
    [customers]
  );

  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.IM_ID, item])),
    [items]
  );

  const invoiceMap = useMemo(
    () => new Map(invoices.map((invoice) => [invoice.order_id, invoice])),
    [invoices]
  );

  const returnedQuantities = useMemo(() => {
    const totals = new Map<number, number>();

    returns.forEach((record) => {
      const current = totals.get(record.Order_Detail_ID) ?? 0;

      totals.set(
        record.Order_Detail_ID,
        current + record.quantity
      );
    });

    return totals;
  }, [returns]);

  const availableDetails = useMemo(
    () =>
      orders
        .filter((order) => invoiceMap.has(order.order_id))
        .filter((order) => order.status !== "Cancelled")
        .flatMap((order) =>
          order.details
            .filter((detail) => {
              const returned =
                returnedQuantities.get(detail.order_detail_id) ?? 0;

              return returned < detail.quantity;
            })
            .map((detail) => ({
              ...detail,
              order,
              remaining:
                detail.quantity -
                (returnedQuantities.get(detail.order_detail_id) ?? 0),
            }))
        ),
    [orders, invoiceMap, returnedQuantities]
  );

  const selectedDetail = availableDetails.find(
    (detail) => detail.order_detail_id === Number(orderDetailId)
  );

  const selectedInvoice = selectedDetail
    ? invoiceMap.get(selectedDetail.order_id)
    : undefined;

  const calculatedAmount =
    selectedDetail && Number(quantity) > 0
      ? (Number(selectedDetail.line_total) /
          selectedDetail.quantity) *
        Number(quantity)
      : 0;

  const totalReturnedAmount = returns.reduce(
    (sum, record) => sum + Number(record.return_amount ?? 0),
    0
  );

  const totalReturnedItems = returns.reduce(
    (sum, record) => sum + record.quantity,
    0
  );

  const filteredReturns = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return returns;

    return returns.filter((record) => {
      const order = orders.find(
        (item) => item.order_id ===
          orderMap.get(
            orderMap.get(
              invoices.find((invoice) =>
                invoice.invoice_id === record.invoice_id
              )?.order_id ?? -1
            )?.order_id ?? -1
          )?.order_id
      );

      const relatedOrder = orders.find((item) =>
        item.details.some(
          (detail) =>
            detail.order_detail_id === record.Order_Detail_ID
        )
      );

      const customerName = relatedOrder
        ? customerMap.get(relatedOrder.customer_id)?.name ?? ""
        : "";

      const itemName = relatedOrder
        ? itemMap.get(
            relatedOrder.details.find(
              (detail) =>
                detail.order_detail_id === record.Order_Detail_ID
            )?.IM_ID ?? -1
          )?.Item_Name ?? ""
        : "";

      return (
        String(record.return_id).includes(term) ||
        String(record.invoice_id).includes(term) ||
        String(relatedOrder?.order_id ?? "").includes(term) ||
        customerName.toLowerCase().includes(term) ||
        itemName.toLowerCase().includes(term)
      );
    });
  }, [returns, orders, invoices, orderMap, customerMap, itemMap]);

  function resetForm() {
    setOrderDetailId("");
    setReturnDate(new Date().toISOString().slice(0, 10));
    setQuantity("1");
    setReason("");
    setReturnAmount("");
    setShowForm(false);
  }

  async function handleCreateReturn() {
    setError("");

    if (!selectedDetail || !selectedInvoice) {
      setError("Please select an available sales order item.");
      return;
    }

    const returnQuantity = Number(quantity);

    if (!Number.isInteger(returnQuantity) || returnQuantity <= 0) {
      setError("Return quantity must be a positive whole number.");
      return;
    }

    if (returnQuantity > selectedDetail.remaining) {
      setError(
        `Only ${selectedDetail.remaining} item(s) remain eligible for return.`
      );
      return;
    }

    if (!returnDate) {
      setError("Please select a return date.");
      return;
    }

    if (returnAmount.trim() && Number(returnAmount) < 0) {
      setError("Return amount cannot be negative.");
      return;
    }

    const data: SalesReturnCreate = {
      Order_Detail_ID: selectedDetail.order_detail_id,
      invoice_id: selectedInvoice.invoice_id,
      return_date: returnDate,
      quantity: returnQuantity,
      reason: reason.trim() || null,
      return_amount: returnAmount.trim()
        ? Number(returnAmount)
        : null,
    };

    setSaving(true);

    try {
      await salesReturnAPI.create(data);
      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create sales return."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">

        <header>
          <p className="text-sm font-medium text-gray-500">
            Sales Module / Sales Return
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Sales Returns
              </h1>

              <p className="mt-2 text-sm text-gray-600">
                Manage returned items and customer refund amounts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowForm(true);
              }}
              disabled={availableDetails.length === 0}
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Create Sales Return
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

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Returns</p>
            <p className="mt-2 text-2xl font-semibold">
              {returns.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Returned Amount</p>
            <p className="mt-2 text-2xl font-semibold">
              {money(totalReturnedAmount)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Returned Items</p>
            <p className="mt-2 text-2xl font-semibold">
              {totalReturnedItems}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">Sales Return History</h2>
              <p className="mt-1 text-sm text-gray-500">
                View all returned items and their details.
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search return, order, item, or customer..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-gray-900 sm:max-w-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Return No.</th>
                  <th className="px-5 py-4 font-medium">Order No.</th>
                  <th className="px-5 py-4 font-medium">Invoice No.</th>
                  <th className="px-5 py-4 font-medium">Customer</th>
                  <th className="px-5 py-4 font-medium">Returned Item</th>
                  <th className="px-5 py-4 font-medium">Return Date</th>
                  <th className="px-5 py-4 font-medium">Quantity</th>
                  <th className="px-5 py-4 font-medium">Return Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-gray-500">
                      Loading sales returns...
                    </td>
                  </tr>
                ) : filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-gray-500">
                      No sales returns found.
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((record) => {
                    const relatedOrder = orders.find((order) =>
                      order.details.some(
                        (detail) =>
                          detail.order_detail_id === record.Order_Detail_ID
                      )
                    );

                    const relatedDetail = relatedOrder?.details.find(
                      (detail) =>
                        detail.order_detail_id === record.Order_Detail_ID
                    );

                    const customer = relatedOrder
                      ? customerMap.get(relatedOrder.customer_id)
                      : undefined;

                    const item = relatedDetail
                      ? itemMap.get(relatedDetail.IM_ID)
                      : undefined;

                    return (
                      <tr key={record.return_id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium">
                          RET-{String(record.return_id).padStart(4, "0")}
                        </td>

                        <td className="px-5 py-4">
                          {relatedOrder
                            ? `SO-${String(relatedOrder.order_id).padStart(4, "0")}`
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          SI-{String(record.invoice_id).padStart(4, "0")}
                        </td>

                        <td className="px-5 py-4">
                          {customer?.name ?? "Unknown customer"}
                        </td>

                        <td className="px-5 py-4">
                          {item?.Item_Name ?? `Item #${relatedDetail?.IM_ID ?? "—"}`}
                          {item?.SKU && (
                            <p className="mt-1 text-xs text-gray-500">
                              {item.SKU}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {new Date(
                            `${record.return_date}T00:00:00`
                          ).toLocaleDateString("en-PH")}
                        </td>

                        <td className="px-5 py-4">{record.quantity}</td>

                        <td className="px-5 py-4 font-medium">
                          {money(record.return_amount ?? 0)}
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
          <div className="my-auto w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Create Sales Return
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Record an item returned by a customer.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="text-gray-500 hover:text-gray-900"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Sales Order Item
                </label>

                <select
                  value={orderDetailId}
                  onChange={(e) => {
                    setOrderDetailId(e.target.value);
                    setQuantity("1");
                    setReturnAmount("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                >
                  <option value="">Select order item</option>

                  {availableDetails.map((detail) => {
                    const item = itemMap.get(detail.IM_ID);

                    return (
                      <option
                        key={detail.order_detail_id}
                        value={detail.order_detail_id}
                      >
                        SO-{String(detail.order_id).padStart(4, "0")}
                        {" — "}
                        {item?.Item_Name ?? `Item #${detail.IM_ID}`}
                        {" — "}
                        {detail.remaining} remaining
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedDetail && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Selected Item
                  </p>

                  <p className="mt-1 font-semibold">
                    {itemMap.get(selectedDetail.IM_ID)?.Item_Name ??
                      `Item #${selectedDetail.IM_ID}`}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Ordered Quantity</p>
                      <p className="font-medium">
                        {selectedDetail.quantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Remaining Quantity</p>
                      <p className="font-medium">
                        {selectedDetail.remaining}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    Invoice: SI-{String(selectedInvoice?.invoice_id).padStart(4, "0")}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Return Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  max={selectedDetail?.remaining ?? 1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Return Date
                </label>

                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Reason for Return
                </label>

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Enter the reason for returning the item..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Return Amount (Optional)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(e.target.value)}
                  placeholder="Leave blank for automatic calculation"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Estimated amount: {money(calculatedAmount)}.
                  Leave blank to let the backend calculate it.
                </p>
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
                  onClick={() => void handleCreateReturn()}
                  disabled={saving || availableDetails.length === 0}
                  className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create Return"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
