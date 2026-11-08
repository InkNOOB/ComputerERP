
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  invoiceAPI,
  salesOrderAPI,
  paymentCollectionAPI,
  accountsReceivableAPI,
  salesReturnAPI,
} from "../../lib/api";

import type { SalesInvoice } from "../../types/invoice";
import type { SalesOrder } from "../../types/order";
import type { Collection } from "../../types/payment";
import type { AccountsReceivable } from "../../types/accounts-receivable";
import type { SalesReturn } from "../../types/return";

type ReportPeriod = "all" | "today" | "month" | "year";

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value || 0);

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function isInPeriod(dateValue: string, period: ReportPeriod) {
  if (period === "all") return true;

  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00`);
  const now = new Date();
  const todayDate = today();

  if (period === "today") {
    return dateValue.slice(0, 10) === todayDate;
  }

  if (period === "month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  return date.getFullYear() === now.getFullYear();
}

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [returns, setReturns] = useState<SalesReturn[]>([]);

  const [period, setPeriod] = useState<ReportPeriod>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        invoiceData,
        orderData,
        collectionData,
        receivableData,
        returnData,
      ] = await Promise.all([
        invoiceAPI.getAll(),
        salesOrderAPI.getAll(),
        paymentCollectionAPI.getAll(),
        accountsReceivableAPI.getAll(),
        salesReturnAPI.getAll(),
      ]);

      setInvoices(invoiceData);
      setOrders(orderData);
      setCollections(collectionData);
      setReceivables(receivableData);
      setReturns(returnData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load sales reports."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => ({
    invoices: invoices.filter((item) =>
      isInPeriod(item.invoice_date, period)
    ),
    orders: orders.filter((item) =>
      isInPeriod(item.order_date, period)
    ),
    collections: collections.filter((item) =>
      isInPeriod(item.payment_date, period)
    ),
    returns: returns.filter((item) =>
      isInPeriod(item.return_date, period)
    ),
  }), [invoices, orders, collections, returns, period]);

  const totals = useMemo(() => ({
    revenue: filtered.invoices.reduce(
      (sum, item) => sum + Number(item.total_due || 0), 0
    ),
    orderAmount: filtered.orders.reduce(
      (sum, item) => sum + Number(item.total_amount || 0), 0
    ),
    collected: filtered.collections.reduce(
      (sum, item) => sum + Number(item.amount_paid || 0), 0
    ),
    outstanding: receivables.reduce(
      (sum, item) => sum + Number(item.balance || 0), 0
    ),
    returned: filtered.returns.reduce(
      (sum, item) => sum + Number(item.return_amount || 0), 0
    ),
  }), [filtered, receivables]);

  const reportRows = [
    {
      title: "Sales Revenue",
      period: "Invoice Date",
      count: filtered.invoices.length,
      amount: money(totals.revenue),
    },
    {
      title: "Sales Orders",
      period: "Order Date",
      count: filtered.orders.length,
      amount: money(totals.orderAmount),
    },
    {
      title: "Payment Collections",
      period: "Payment Date",
      count: filtered.collections.length,
      amount: money(totals.collected),
    },
    {
      title: "Accounts Receivable",
      period: "Current Balance",
      count: receivables.length,
      amount: money(totals.outstanding),
    },
    {
      title: "Sales Returns",
      period: "Return Date",
      count: filtered.returns.length,
      amount: money(totals.returned),
    },
  ];

  const exportCSV = () => {
    const rows = [
      ["Report", "Period", "Total Records", "Total Amount"],
      ...reportRows.map((row) => [
        row.title,
        row.period,
        String(row.count),
        row.amount,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Sales Module
            </p>
            <h1 className="text-3xl font-bold">Sales Reports</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review sales activity, revenue, orders, and collections.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={exportCSV}
              disabled={loading || !!error}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Report Period
          </label>
          <select
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value as ReportPeriod)
            }
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Loading sales reports...
          </div>
        ) : !error ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard
                title="Sales Revenue"
                value={money(totals.revenue)}
                color="text-green-600"
              />
              <SummaryCard
                title="Sales Orders"
                value={String(filtered.orders.length)}
                color="text-blue-600"
              />
              <SummaryCard
                title="Total Collections"
                value={money(totals.collected)}
                color="text-purple-600"
              />
              <SummaryCard
                title="Outstanding Receivables"
                value={money(totals.outstanding)}
                color="text-orange-600"
              />
              <SummaryCard
                title="Sales Returns"
                value={money(totals.returned)}
                color="text-red-600"
              />
              <SummaryCard
                title="Invoices Issued"
                value={String(filtered.invoices.length)}
                color="text-indigo-600"
              />
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold">
                Report Summary
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Report</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Total Records</th>
                      <th className="px-4 py-3">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportRows.map((row) => (
                      <tr key={row.title} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          {row.title}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {row.period}
                        </td>
                        <td className="px-4 py-3">{row.count}</td>
                        <td className="px-4 py-3 font-semibold">
                          {row.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
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
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
