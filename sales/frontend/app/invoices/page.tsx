
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { invoiceAPI, salesOrderAPI } from "../../lib/api";
import type { SalesInvoice, SalesInvoiceCreate } from "../../types/invoice";
import type { SalesOrder } from "../../types/order";

const money = (amount: string | number) =>
  `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState("");

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
        err instanceof Error ? err.message : "Unable to load invoices."
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

    return invoices.filter(
      (invoice) =>
        String(invoice.invoice_id).includes(term) ||
        String(invoice.order_id).includes(term) ||
        invoice.invoice_date.includes(term)
    );
  }, [invoices, search]);

  const totalInvoiced = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total_due),
    0
  );

  const overdueInvoices = invoices.filter(
    (invoice) =>
      invoice.due_date &&
      invoice.due_date < new Date().toISOString().slice(0, 10)
  ).length;

  const selectedOrder = orders.find(
    (order) => order.order_id === Number(orderId)
  );

  function resetForm() {
    setOrderId("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
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
      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create invoice."
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
            Sales Module / Sales Invoice
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Sales Invoices
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage invoices issued for customer orders.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              disabled={availableOrders.length === 0}
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Create Sales Invoice
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
            <p className="text-sm text-gray-500">Total Invoices</p>
            <p className="mt-2 text-2xl font-semibold">{invoices.length}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Invoiced Amount</p>
            <p className="mt-2 text-2xl font-semibold">
              {money(totalInvoiced)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Overdue Invoices</p>
            <p className="mt-2 text-2xl font-semibold text-red-600">
              {overdueInvoices}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">Sales Invoice List</h2>
              <p className="mt-1 text-sm text-gray-500">
                View all invoices generated from sales orders.
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice or order number..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-gray-900 sm:max-w-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Invoice No.</th>
                  <th className="px-5 py-4 font-medium">Order No.</th>
                  <th className="px-5 py-4 font-medium">Invoice Date</th>
                  <th className="px-5 py-4 font-medium">Due Date</th>
                  <th className="px-5 py-4 font-medium">Total Due</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      Loading invoices...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      No sales invoices found.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.invoice_id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-medium">
                        SI-{String(invoice.invoice_id).padStart(4, "0")}
                      </td>
                      <td className="px-5 py-4">
                        SO-{String(invoice.order_id).padStart(4, "0")}
                      </td>
                      <td className="px-5 py-4">
                        {new Date(
                          `${invoice.invoice_date}T00:00:00`
                        ).toLocaleDateString("en-PH")}
                      </td>
                      <td className="px-5 py-4">
                        {invoice.due_date
                          ? new Date(
                              `${invoice.due_date}T00:00:00`
                            ).toLocaleDateString("en-PH")
                          : "—"}
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {money(invoice.total_due)}
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
          <div className="my-auto w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Create Sales Invoice</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Generate an invoice from an existing sales order.
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
                  {availableOrders.map((order) => (
                    <option key={order.order_id} value={order.order_id}>
                      SO-{String(order.order_id).padStart(4, "0")} —{" "}
                      {money(order.total_amount)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrder && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Invoice Amount</p>
                  <p className="mt-1 text-xl font-semibold">
                    {money(selectedOrder.total_amount)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Automatically taken from the selected sales order.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  min={invoiceDate}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
                  onClick={() => void handleCreateInvoice()}
                  disabled={saving || availableOrders.length === 0}
                  className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
