
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  accountsReceivableAPI,
  invoiceAPI,
  salesOrderAPI,
  customerAPI,
} from "../../lib/api";

import type { AccountsReceivable } from "../../types/accounts-receivable";
import type { SalesInvoice } from "../../types/invoice";
import type { SalesOrder } from "../../types/order";
import type { Customer } from "../../types/customer";

type ARRow = {
  AR_ID: number;
  invoice_id: number;
  customer_name: string;
  due_date: string | null;
  amount_due: number;
  amount_paid: number;
  balance: number;
  status: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

const amount = (value: string | number) => Number(value) || 0;

export default function AccountsReceivablePage() {
  const [records, setRecords] = useState<ARRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [arData, invoiceData, orderData, customerData] =
        await Promise.all([
          accountsReceivableAPI.getAll(),
          invoiceAPI.getAll(),
          salesOrderAPI.getAll(),
          customerAPI.getAll(),
        ]);

      const invoices = new Map<number, SalesInvoice>(
        invoiceData.map((invoice: SalesInvoice) => [
          invoice.invoice_id,
          invoice,
        ])
      );

      const orders = new Map<number, SalesOrder>(
        orderData.map((order: SalesOrder) => [
          order.order_id,
          order,
        ])
      );

      const customers = new Map<number, Customer>(
        customerData.map((customer: Customer) => [
          customer.customer_id,
          customer,
        ])
      );

      const rows: ARRow[] = arData.map(
        (record: AccountsReceivable) => {
          const invoice = invoices.get(record.invoice_id);
          const order = invoice
            ? orders.get(invoice.order_id)
            : undefined;
          const customer = order
            ? customers.get(order.customer_id)
            : undefined;

          return {
            AR_ID: record.AR_ID,
            invoice_id: record.invoice_id,
            customer_name: customer?.name ?? "Unknown Customer",
            due_date: invoice?.due_date ?? null,
            amount_due: amount(record.amount_due),
            amount_paid: amount(record.amount_paid),
            balance: amount(record.balance),
            status: record.status ?? "Unpaid",
          };
        }
      );

      setRecords(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load accounts receivable records."
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
        String(record.AR_ID).includes(keyword) ||
        String(record.invoice_id).includes(keyword) ||
        record.customer_name.toLowerCase().includes(keyword)
    );
  }, [records, search]);

  const totals = useMemo(() => {
    return {
      amountDue: records.reduce(
        (sum, record) => sum + record.amount_due,
        0
      ),
      amountPaid: records.reduce(
        (sum, record) => sum + record.amount_paid,
        0
      ),
      balance: records.reduce(
        (sum, record) => sum + record.balance,
        0
      ),
      unpaid: records.filter(
        (record) => record.status !== "Paid"
      ).length,
    };
  }, [records]);

  const statusStyle = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Sales Module
            </p>
            <h1 className="text-3xl font-bold">
              Accounts Receivable
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor customer balances and outstanding invoices.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Receivables"
            value={money(totals.amountDue)}
            color="text-blue-600"
          />
          <SummaryCard
            title="Amount Collected"
            value={money(totals.amountPaid)}
            color="text-green-600"
          />
          <SummaryCard
            title="Outstanding Balance"
            value={money(totals.balance)}
            color="text-red-600"
          />
          <SummaryCard
            title="Unpaid Accounts"
            value={String(totals.unpaid)}
            color="text-orange-600"
          />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">
              Receivable Records
            </h2>

            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 sm:max-w-xs"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Loading accounts receivable...
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">AR No.</th>
                    <th className="px-4 py-3">Invoice No.</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Amount Due</th>
                    <th className="px-4 py-3">Amount Paid</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.AR_ID}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium">
                        AR-{record.AR_ID}
                      </td>
                      <td className="px-4 py-3">
                        INV-{record.invoice_id}
                      </td>
                      <td className="px-4 py-3">
                        {record.customer_name}
                      </td>
                      <td className="px-4 py-3">
                        {record.due_date
                          ? new Date(
                              `${record.due_date}T00:00:00`
                            ).toLocaleDateString("en-PH")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {money(record.amount_due)}
                      </td>
                      <td className="px-4 py-3 text-green-700">
                        {money(record.amount_paid)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {money(record.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(record.status)}`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        {search
                          ? "No matching records found."
                          : "No accounts receivable records yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredRecords.length} of {records.length} records
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
