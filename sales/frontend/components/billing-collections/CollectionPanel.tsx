
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  paymentCollectionAPI,
  accountsReceivableAPI,
  invoiceAPI,
  salesOrderAPI,
  customerAPI,
} from "../../lib/api";

import type { Collection, CollectionCreate } from "../../types/payment";
import type { AccountsReceivable } from "../../types/accounts-receivable";
import type { SalesInvoice } from "../../types/invoice";
import type { SalesOrder } from "../../types/order";
import type { Customer } from "../../types/customer";

type CollectionRow = Collection & {
  customer_name: string;
  invoice_id: number | null;
};

const PAGE_SIZE = 10;

const money = (value: string | number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value) || 0);

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-PH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function CollectionsPanel() {
  const [records, setRecords] = useState<CollectionRow[]>([]);
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<CollectionCreate>({
    AR_ID: 0,
    payment_date: getToday(),
    payment_method: "Cash",
    amount_paid: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        paymentData,
        arData,
        invoiceData,
        orderData,
        customerData,
      ] = await Promise.all([
        paymentCollectionAPI.getAll(),
        accountsReceivableAPI.getAll(),
        invoiceAPI.getAll(),
        salesOrderAPI.getAll(),
        customerAPI.getAll(),
      ]);

      const invoiceMap = new Map<number, SalesInvoice>(
        invoiceData.map((item: SalesInvoice) => [
          item.invoice_id,
          item,
        ])
      );

      const orderMap = new Map<number, SalesOrder>(
        orderData.map((item: SalesOrder) => [
          item.order_id,
          item,
        ])
      );

      const customerMap = new Map<number, Customer>(
        customerData.map((item: Customer) => [
          item.customer_id,
          item,
        ])
      );

      const arMap = new Map<number, AccountsReceivable>(
        arData.map((item: AccountsReceivable) => [
          item.AR_ID,
          item,
        ])
      );

      const rows: CollectionRow[] = paymentData.map(
        (payment: Collection) => {
          const ar = arMap.get(payment.AR_ID);
          const invoice = ar
            ? invoiceMap.get(ar.invoice_id)
            : undefined;
          const order = invoice
            ? orderMap.get(invoice.order_id)
            : undefined;
          const customer = order
            ? customerMap.get(order.customer_id)
            : undefined;

          return {
            ...payment,
            invoice_id: ar?.invoice_id ?? null,
            customer_name: customer?.name ?? "Unknown Customer",
          };
        }
      );

      setRecords(rows);
      setReceivables(arData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load payment collections."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return records;

    return records.filter(
      (record) =>
        String(record.payment_id).includes(keyword) ||
        String(record.AR_ID).includes(keyword) ||
        String(record.invoice_id ?? "").includes(keyword) ||
        record.customer_name.toLowerCase().includes(keyword) ||
        (record.payment_method ?? "").toLowerCase().includes(keyword) ||
        String(record.payment_date ?? "").toLowerCase().includes(keyword)
    );
  }, [records, search]);

  const totals = useMemo(
    () => ({
      collected: records.reduce(
        (sum, record) => sum + Number(record.amount_paid),
        0
      ),
      count: records.length,
      cash: records.filter(
        (record) => record.payment_method === "Cash"
      ).length,
    }),
    [records]
  );

  const unpaidReceivables = useMemo(
    () =>
      receivables.filter(
        (record) => Number(record.balance) > 0
      ),
    [receivables]
  );

  const selectedAR = receivables.find(
    (record) => record.AR_ID === form.AR_ID
  );

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.AR_ID) {
      setError("Please select an unpaid or partially paid account.");
      return;
    }

    if (!Number.isFinite(form.amount_paid) || form.amount_paid <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    const currentAR = receivables.find(
      (record) => record.AR_ID === form.AR_ID
    );

    if (!currentAR) {
      setError("Selected accounts receivable record was not found.");
      return;
    }

    const remainingBalance = Number(currentAR.balance);

    if (form.amount_paid > remainingBalance) {
      setError(
        `Payment cannot exceed the remaining balance of ${money(remainingBalance)}.`
      );
      return;
    }

    try {
      setSaving(true);

      await paymentCollectionAPI.create(form);

      setSuccess("Payment successfully recorded.");

      setForm({
        AR_ID: 0,
        payment_date: getToday(),
        payment_method: "Cash",
        amount_paid: 0,
      });

      setPage(1);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to record payment."
      );
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return filteredRecords.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );
  }, [filteredRecords, currentPage]);

  const startRecord =
    filteredRecords.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endRecord = Math.min(
    currentPage * PAGE_SIZE,
    filteredRecords.length
  );

  return (
    <div className="space-y-5 text-slate-800">

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Collected"
          value={money(totals.collected)}
          color="text-green-700"
        />
        <SummaryCard
          title="Payment Transactions"
          value={String(totals.count)}
          color="text-blue-700"
        />
        <SummaryCard
          title="Cash Transactions"
          value={String(totals.cash)}
          color="text-amber-700"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5">
          <h3 className="font-semibold text-slate-900">
            Record New Payment
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Select an outstanding account and enter the payment details.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Accounts Receivable
            </label>
            <select
              value={form.AR_ID || ""}
              onChange={(event) => {
                setForm({
                  ...form,
                  AR_ID: Number(event.target.value),
                });
                setError("");
                setSuccess("");
              }}
              required
              disabled={loading || unpaidReceivables.length === 0}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              <option value="">
                {loading
                  ? "Loading accounts..."
                  : unpaidReceivables.length === 0
                    ? "No outstanding accounts"
                    : "Select an account"}
              </option>

              {unpaidReceivables.map((record) => (
                <option key={record.AR_ID} value={record.AR_ID}>
                  AR-{record.AR_ID} · Invoice #{record.invoice_id} · Balance:{" "}
                  {money(record.balance)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Payment Date
            </label>
            <input
              type="date"
              value={form.payment_date}
              max={getToday()}
              onChange={(event) => {
                setForm({
                  ...form,
                  payment_date: event.target.value,
                });
                setError("");
                setSuccess("");
              }}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Payment Method
            </label>
            <select
              value={form.payment_method ?? "Cash"}
              onChange={(event) =>
                setForm({
                  ...form,
                  payment_method: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Cash">Cash</option>
              <option value="E-Wallet">E-Wallet</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Amount Received (₱)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              max={selectedAR ? Number(selectedAR.balance) : undefined}
              value={form.amount_paid || ""}
              onChange={(event) => {
                setForm({
                  ...form,
                  amount_paid: Number(event.target.value),
                });
                setError("");
                setSuccess("");
              }}
              required
              placeholder="Enter payment amount"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {selectedAR && (
              <p className="mt-1.5 text-xs text-slate-500">
                Remaining balance:{" "}
                <span className="font-semibold text-slate-700">
                  {money(selectedAR.balance)}
                </span>
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={
                saving ||
                loading ||
                unpaidReceivables.length === 0
              }
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Recording Payment..." : "Record Payment"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Payment History
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              View recorded customer payments and transaction details.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search payment, invoice, or customer..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading payment history...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-center">Payment No.</th>
                    <th className="px-4 py-3 text-center">AR No.</th>
                    <th className="px-4 py-3 text-center">Invoice No.</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Payment Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Method</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.map((record) => (
                    <tr
                      key={record.payment_id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        PAY-{record.payment_id}
                      </td>

                      <td className="px-4 py-3 text-center text-slate-700">
                        AR-{record.AR_ID}
                      </td>

                      <td className="px-4 py-3 text-center font-medium text-blue-700">
                        {record.invoice_id
                          ? `INV-${record.invoice_id}`
                          : "—"}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {record.customer_name}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {formatDate(record.payment_date)}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-green-700">
                        {money(record.amount_paid)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {record.payment_method ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {paginatedRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        {search
                          ? "No matching payment records found."
                          : "No payment records yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {startRecord}-{endRecord}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredRecords.length}
                </span>{" "}
                payments
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="min-w-20 text-center text-sm font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}
