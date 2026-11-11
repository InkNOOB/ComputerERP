
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { invoiceAPI, salesOrderAPI } from "../../lib/api";

import type {
  SalesInvoice,
  SalesInvoiceCreate,
} from "../../types/invoice";

import type { SalesOrder } from "../../types/order";

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

function formatDate(value: string | null) {
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
  valueColor = "text-slate-900",
}: {
  label: string;
  value: string | number;
  description: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className={`mt-2 text-2xl font-bold tracking-tight ${valueColor}`}>
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export default function InvoicePanel() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(getLocalDate);
  const [dueDate, setDueDate] = useState("");

  const today = getLocalDate();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [invoiceData, orderData] = await Promise.all([
        invoiceAPI.getAll(),
        salesOrderAPI.getAll(),
      ]);

      setInvoices(invoiceData);
      setOrders(orderData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load invoices."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const invoicedOrderIds = useMemo(
    () => new Set(invoices.map((invoice) => invoice.order_id)),
    [invoices]
  );

  const availableOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          !invoicedOrderIds.has(order.order_id) &&
          order.status !== "Cancelled"
      ),
    [orders, invoicedOrderIds]
  );

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return invoices;

    return invoices.filter((invoice) => {
      const invoiceDateValue = invoice.invoice_date ?? "";
      const dueDateValue = invoice.due_date ?? "";

      return (
        String(invoice.invoice_id).includes(term) ||
        String(invoice.order_id).includes(term) ||
        invoiceDateValue.toLowerCase().includes(term) ||
        dueDateValue.toLowerCase().includes(term)
      );
    });
  }, [invoices, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / PAGE_SIZE)
  );

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return filteredInvoices.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );
  }, [filteredInvoices, currentPage]);

  const totalInvoiced = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total_due),
    0
  );

  const overdueInvoices = invoices.filter(
    (invoice) =>
      invoice.due_date &&
      invoice.due_date.slice(0, 10) < today
  ).length;

  const selectedOrder = orders.find(
    (order) => order.order_id === Number(orderId)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function resetForm() {
    if (saving) return;

    setOrderId("");
    setInvoiceDate(getLocalDate());
    setDueDate("");
    setShowForm(false);
  }

  async function handleCreateInvoice() {
    setError("");

    if (!orderId) {
      setError("Please select a sales order.");
      return;
    }

    if (!invoiceDate) {
      setError("Please select an invoice date.");
      return;
    }

    if (dueDate && dueDate < invoiceDate) {
      setError("Due date cannot be earlier than invoice date.");
      return;
    }

    const data: SalesInvoiceCreate = {
      order_id: Number(orderId),
      invoice_date: invoiceDate,
      due_date: dueDate || null,
    };

    setSaving(true);

    try {
      await invoiceAPI.create(data);

      setOrderId("");
      setInvoiceDate(getLocalDate());
      setDueDate("");
      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create invoice."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
  <button
    type="button"
    onClick={() => {
      setError("");
      setShowForm(true);
    }}
    disabled={availableOrders.length === 0 || loading}
    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    + Create Sales Invoice
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
          label="Total Invoices"
          value={invoices.length}
          description="Recorded sales invoices"
        />

        <SummaryCard
          label="Total Invoiced Amount"
          value={money(totalInvoiced)}
          description="Combined invoice value"
        />

        <SummaryCard
          label="Overdue Invoices"
          value={overdueInvoices}
          description="Invoices past their due date"
          valueColor="text-red-600"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-semibold text-slate-900">
              Sales Invoice List
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              View all invoices generated from sales orders.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoice or order number..."
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4 font-semibold">Invoice No.</th>
                <th className="px-5 py-4 font-semibold">Order No.</th>
                <th className="px-5 py-4 font-semibold">Invoice Date</th>
                <th className="px-5 py-4 font-semibold">Due Date</th>
                <th className="px-5 py-4 text-right font-semibold">
                  Total Due
                </th>
                <th className="px-5 py-4 text-center font-semibold">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Loading invoices...
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No sales invoices found.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => {
                  const isOverdue =
                    Boolean(invoice.due_date) &&
                    invoice.due_date!.slice(0, 10) < today;

                  return (
                    <tr
                      key={invoice.invoice_id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        SI-{String(invoice.invoice_id).padStart(4, "0")}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        SO-{String(invoice.order_id).padStart(4, "0")}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatDate(invoice.invoice_date)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatDate(invoice.due_date)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-900">
                        {money(invoice.total_due)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        {isOverdue ? (
                          <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Current
                          </span>
                        )}
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
            {filteredInvoices.length === 0
              ? 0
              : (currentPage - 1) * PAGE_SIZE + 1}
            {" "}to{" "}
            {Math.min(
              currentPage * PAGE_SIZE,
              filteredInvoices.length
            )}
            {" "}of {filteredInvoices.length} invoices
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
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
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
                  Create Sales Invoice
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Generate an invoice from an existing sales order.
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
                  Sales Order
                </label>

                <select
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select sales order</option>

                  {availableOrders.map((order) => (
                    <option
                      key={order.order_id}
                      value={order.order_id}
                    >
                      SO-{String(order.order_id).padStart(4, "0")} —{" "}
                      {money(order.total_amount)}
                    </option>
                  ))}
                </select>

                {availableOrders.length === 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    No uninvoiced sales orders are currently available.
                  </p>
                )}
              </div>

              {selectedOrder && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Invoice Amount
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {money(selectedOrder.total_amount)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Automatically taken from the selected sales order.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Invoice Date
                </label>

                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(event) => setInvoiceDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Due Date (Optional)
                </label>

                <input
                  type="date"
                  min={invoiceDate}
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
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
                  onClick={() => void handleCreateInvoice()}
                  disabled={saving || availableOrders.length === 0}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
