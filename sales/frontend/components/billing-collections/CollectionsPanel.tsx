
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

const money = (value: string | number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value) || 0);

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function CollectionsPage() {
  const [records, setRecords] = useState<CollectionRow[]>([]);
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<CollectionCreate>({
    AR_ID: 0,
    payment_date: today(),
    payment_method: "Cash",
    transaction_number: null,
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
    const keyword = search.toLowerCase();

    return records.filter(
      (record) =>
        String(record.payment_id).includes(keyword) ||
        String(record.invoice_id ?? "").includes(keyword) ||
        record.customer_name.toLowerCase().includes(keyword) ||
        (record.payment_method ?? "").toLowerCase().includes(keyword) ||
        (record.transaction_number ?? "").toLowerCase().includes(keyword)
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

    if (form.amount_paid <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    if (
      form.payment_method === "E-Wallet" &&
      !form.transaction_number?.trim()
    ) {
      setError("Please enter the e-wallet transaction number.");
      return;
    }

    const selectedAR = receivables.find(
      (record) => record.AR_ID === form.AR_ID
    );

    if (!selectedAR) {
      setError("Selected accounts receivable record was not found.");
      return;
    }

    if (form.amount_paid > Number(selectedAR.balance)) {
      setError("Payment cannot exceed the remaining balance.");
      return;
    }

    try {
      setSaving(true);

      const paymentData: CollectionCreate = {
        ...form,
        transaction_number:
          form.payment_method === "E-Wallet"
            ? form.transaction_number?.trim() || null
            : null,
      };

      await paymentCollectionAPI.create(paymentData);

      setSuccess("Payment successfully recorded.");

      setForm({
        AR_ID: 0,
        payment_date: today(),
        payment_method: "Cash",
        transaction_number: null,
        amount_paid: 0,
      });

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

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Collected"
            value={money(totals.collected)}
            color="text-green-600"
          />

          <SummaryCard
            title="Payment Transactions"
            value={String(totals.count)}
            color="text-blue-600"
          />

          <SummaryCard
            title="Cash Transactions"
            value={String(totals.cash)}
            color="text-orange-600"
          />
        </section>

        {/* Record New Payment */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">
            Record New Payment
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2"
          >
            {/* Accounts Receivable */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Accounts Receivable
              </label>

              <select
                value={form.AR_ID || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    AR_ID: Number(event.target.value),
                  })
                }
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select an account</option>

                {receivables
                  .filter((record) => Number(record.balance) > 0)
                  .map((record) => (
                    <option
                      key={record.AR_ID}
                      value={record.AR_ID}
                    >
                      AR-{record.AR_ID} · Invoice #{record.invoice_id} ·
                      Balance: {money(record.balance)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Payment Date
              </label>

              <input
                type="date"
                value={form.payment_date}
                onChange={(event) =>
                  setForm({
                    ...form,
                    payment_date: event.target.value,
                  })
                }
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Payment Method
              </label>

              <select
                value={form.payment_method ?? "Cash"}
                onChange={(event) =>
                  setForm({
                    ...form,
                    payment_method: event.target.value,
                    transaction_number: null,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* E-Wallet Transaction Number */}
            {form.payment_method === "E-Wallet" && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Transaction Number
                </label>

                <input
                  type="text"
                  value={form.transaction_number ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      transaction_number: event.target.value,
                    })
                  }
                  required
                  maxLength={100}
                  placeholder="Enter e-wallet transaction number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            )}

            {/* Amount Received */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Amount Received (₱)
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount_paid || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    amount_paid: Number(event.target.value),
                  })
                }
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Enter payment amount"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="md:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="md:col-span-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={
                  saving ||
                  loading ||
                  receivables.every(
                    (record) => Number(record.balance) <= 0
                  )
                }
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Recording Payment..." : "Record Payment"}
              </button>
            </div>
          </form>
        </section>

        {/* Payment History */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">
              Payment History
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search payment, customer, or transaction..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm sm:max-w-xs"
              />
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Loading payment history...
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-center">Payment No.</th>
                    <th className="px-4 py-3 text-center">AR No.</th>
                    <th className="px-4 py-3 text-center">Invoice No.</th>
                    <th className="px-4 py-3 text-center">Customer</th>
                    <th className="px-4 py-3 text-center">Payment Date</th>
                    <th className="px-4 py-3 text-center">Amount</th>
                    <th className="px-4 py-3 text-center">Method</th>
                    <th className="px-4 py-3 text-center">Transaction No.</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.payment_id}
                      className="hover:bg-gray-50 text-center"
                    >
                      <td className="px-4 py-3 font-medium">
                        PAY-{record.payment_id}
                      </td>

                      <td className="px-4 py-3">
                        AR-{record.AR_ID}
                      </td>

                      <td className="px-4 py-3">
                        {record.invoice_id
                          ? `INV-${record.invoice_id}`
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        {record.customer_name}
                      </td>

                      <td className="px-4 py-3">
                        {new Date(
                          `${record.payment_date}T00:00:00`
                        ).toLocaleDateString("en-PH")}
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        {money(record.amount_paid)}
                      </td>

                      <td className="px-4 py-3">
                        {record.payment_method ?? "—"}
                      </td>

                      <td className="px-4 py-3">
                        {record.transaction_number || "—"}
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No payment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredRecords.length} of {records.length} payments
          </div>
        </section>
      </div>
    </main>
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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}
