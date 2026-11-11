
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

const PAGE_SIZE = 10;

const money = (amount: string | number) =>
  `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-PH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export default function ReturnsPanel() {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<SalesOrderItem[]>([]);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [orderDetailId, setOrderDetailId] = useState("");
  const [returnDate, setReturnDate] = useState(getLocalDate);
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
    () =>
      new Map(
        customers.map((customer) => [customer.customer_id, customer])
      ),
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

  const detailMap = useMemo(() => {
    const map = new Map<
      number,
      {
        order: SalesOrder;
        detail: SalesOrderItem;
      }
    >();

    orders.forEach((order) => {
      order.details.forEach((detail) => {
        map.set(detail.order_detail_id, {
          order,
          detail,
        });
      });
    });

    return map;
  }, [orders]);

  const returnedQuantities = useMemo(() => {
    const totals = new Map<number, number>();

    returns.forEach((record) => {
      const current = totals.get(record.Order_Detail_ID) ?? 0;

      totals.set(
        record.Order_Detail_ID,
        current + Number(record.quantity)
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
            .map((detail) => {
              const returned =
                returnedQuantities.get(detail.order_detail_id) ?? 0;

              return {
                ...detail,
                order,
                remaining: detail.quantity - returned,
              };
            })
            .filter((detail) => detail.remaining > 0)
        ),
    [orders, invoiceMap, returnedQuantities]
  );

  const selectedDetail = availableDetails.find(
    (detail) => detail.order_detail_id === Number(orderDetailId)
  );

  const selectedInvoice = selectedDetail
    ? invoiceMap.get(selectedDetail.order_id)
    : undefined;

  const returnQuantity = Number(quantity);

  const calculatedAmount =
    selectedDetail &&
    Number.isInteger(returnQuantity) &&
    returnQuantity > 0
      ? (Number(selectedDetail.line_total) /
          selectedDetail.quantity) *
        returnQuantity
      : 0;

  const totalReturnedAmount = returns.reduce(
    (sum, record) => sum + Number(record.return_amount ?? 0),
    0
  );

  const totalReturnedItems = returns.reduce(
    (sum, record) => sum + Number(record.quantity),
    0
  );

  const filteredReturns = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return returns;

    return returns.filter((record) => {
      const related = detailMap.get(record.Order_Detail_ID);
      const relatedOrder = related?.order;
      const relatedDetail = related?.detail;

      const customerName = relatedOrder
        ? customerMap.get(relatedOrder.customer_id)?.name ?? ""
        : "";

      const itemName = relatedDetail
        ? itemMap.get(relatedDetail.IM_ID)?.Item_Name ?? ""
        : "";

      return (
        String(record.return_id).includes(term) ||
        String(record.invoice_id).includes(term) ||
        String(relatedOrder?.order_id ?? "").includes(term) ||
        customerName.toLowerCase().includes(term) ||
        itemName.toLowerCase().includes(term)
      );
    });
  }, [returns, detailMap, customerMap, itemMap, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReturns.length / PAGE_SIZE)
  );

  const paginatedReturns = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return filteredReturns.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );
  }, [filteredReturns, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function resetForm() {
    setOrderDetailId("");
    setReturnDate(getLocalDate());
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

    if (
      !Number.isInteger(returnQuantity) ||
      returnQuantity <= 0
    ) {
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

    if (returnAmount.trim()) {
      const amount = Number(returnAmount);

      if (!Number.isFinite(amount) || amount < 0) {
        setError("Please enter a valid, non-negative return amount.");
        return;
      }
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
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Sales Returns
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage returned items and customer refund amounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setShowForm(true);
          }}
          disabled={availableDetails.length === 0 || loading}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Create Sales Return
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Total Returns"
          value={returns.length}
          description="Recorded return transactions"
        />

        <SummaryCard
          label="Total Returned Amount"
          value={money(totalReturnedAmount)}
          description="Combined recorded return value"
        />

        <SummaryCard
          label="Total Returned Items"
          value={totalReturnedItems}
          description="Total quantity of returned items"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-semibold text-slate-900">
              Sales Return History
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              View all returned items and their details.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search return, order, item, or customer..."
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4 font-semibold">Return No.</th>
                <th className="px-5 py-4 font-semibold">Order No.</th>
                <th className="px-5 py-4 font-semibold">Invoice No.</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Returned Item</th>
                <th className="px-5 py-4 font-semibold">Return Date</th>
                <th className="px-5 py-4 text-center font-semibold">
                  Quantity
                </th>
                <th className="px-5 py-4 text-right font-semibold">
                  Return Amount
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Loading sales returns...
                  </td>
                </tr>
              ) : paginatedReturns.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No sales returns found.
                  </td>
                </tr>
              ) : (
                paginatedReturns.map((record) => {
                  const related = detailMap.get(record.Order_Detail_ID);
                  const relatedOrder = related?.order;
                  const relatedDetail = related?.detail;

                  const customer = relatedOrder
                    ? customerMap.get(relatedOrder.customer_id)
                    : undefined;

                  const item = relatedDetail
                    ? itemMap.get(relatedDetail.IM_ID)
                    : undefined;

                  return (
                    <tr
                      key={record.return_id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        RET-{String(record.return_id).padStart(4, "0")}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {relatedOrder
                          ? `SO-${String(relatedOrder.order_id).padStart(4, "0")}`
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        SI-{String(record.invoice_id).padStart(4, "0")}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {customer?.name ?? "Unknown customer"}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        <p className="font-medium text-slate-900">
                          {item?.Item_Name ??
                            `Item #${relatedDetail?.IM_ID ?? "—"}`}
                        </p>
                        {item?.SKU && (
                          <p className="mt-1 text-xs text-slate-500">
                            {item.SKU}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatDate(record.return_date)}
                      </td>

                      <td className="px-5 py-4 text-center font-medium text-slate-700">
                        {record.quantity}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-900">
                        {money(record.return_amount ?? 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">
            Showing{" "}
            {filteredReturns.length === 0
              ? 0
              : (currentPage - 1) * PAGE_SIZE + 1}
            {" "}to{" "}
            {Math.min(currentPage * PAGE_SIZE, filteredReturns.length)}
            {" "}of {filteredReturns.length} returns
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2 text-sm font-medium text-slate-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Sales Return
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Record an item returned by a customer.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Sales Order Item
                </label>

                <select
                  value={orderDetailId}
                  onChange={(event) => {
                    setOrderDetailId(event.target.value);
                    setQuantity("1");
                    setReturnAmount("");
                  }}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Selected Item
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {itemMap.get(selectedDetail.IM_ID)?.Item_Name ??
                      `Item #${selectedDetail.IM_ID}`}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Ordered Quantity</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedDetail.quantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Remaining Quantity</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedDetail.remaining}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    Invoice: SI-
                    {String(selectedInvoice?.invoice_id ?? "").padStart(4, "0")}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Return Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  max={selectedDetail?.remaining ?? 1}
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Return Date
                </label>

                <input
                  type="date"
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reason for Return
                </label>

                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  placeholder="Enter the reason for returning the item..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Return Amount (Optional)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={returnAmount}
                  onChange={(event) => setReturnAmount(event.target.value)}
                  placeholder="Leave blank for automatic calculation"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Estimated amount: {money(calculatedAmount)}.
                  Leave blank to let the backend calculate it.
                </p>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleCreateReturn()}
                  disabled={saving || availableDetails.length === 0}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create Return"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
