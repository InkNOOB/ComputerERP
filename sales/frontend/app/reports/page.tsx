
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function isInPeriod(
  dateValue: string | null | undefined,
  period: ReportPeriod
) {
  if (period === "all") return true;
  if (!dateValue) return false;

  const dateString = dateValue.slice(0, 10);
  const currentDate = today();

  if (period === "today") {
    return dateString === currentDate;
  }

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  if (period === "month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  return date.getFullYear() === now.getFullYear();
}

const periodLabels: Record<ReportPeriod, string> = {
  all: "All Time",
  today: "Today",
  month: "This Month",
  year: "This Year",
};

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
        err instanceof Error
          ? err.message
          : "Failed to load sales reports."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(
    () => ({
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
    }),
    [invoices, orders, collections, returns, period]
  );

  const totals = useMemo(
    () => ({
      revenue: filtered.invoices.reduce(
        (sum, item) => sum + Number(item.total_due || 0),
        0
      ),
      orderAmount: filtered.orders.reduce(
        (sum, item) => sum + Number(item.total_amount || 0),
        0
      ),
      collected: filtered.collections.reduce(
        (sum, item) => sum + Number(item.amount_paid || 0),
        0
      ),
      outstanding: receivables.reduce(
        (sum, item) => sum + Number(item.balance || 0),
        0
      ),
      returned: filtered.returns.reduce(
        (sum, item) => sum + Number(item.return_amount || 0),
        0
      ),
    }),
    [filtered, receivables]
  );

  const reportRows = useMemo(
    () => [
      {
        title: "Sales Revenue",
        period: "Invoice Date",
        count: filtered.invoices.length,
        amount: totals.revenue,
      },
      {
        title: "Sales Orders",
        period: "Order Date",
        count: filtered.orders.length,
        amount: totals.orderAmount,
      },
      {
        title: "Payment Collections",
        period: "Payment Date",
        count: filtered.collections.length,
        amount: totals.collected,
      },
      {
        title: "Accounts Receivable",
        period: "Current Balance",
        count: receivables.length,
        amount: totals.outstanding,
      },
      {
        title: "Sales Returns",
        period: "Return Date",
        count: filtered.returns.length,
        amount: totals.returned,
      },
    ],
    [filtered, totals, receivables]
  );

  function exportCSV() {
    const rows = [
      ["Report", "Period", "Total Records", "Total Amount (PHP)"],
      ...reportRows.map((row) => [
        row.title,
        row.period,
        String(row.count),
        row.amount.toFixed(2),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `sales-reports-${today()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-full space-y-5 p-4 text-slate-800 sm:p-6">

      {/* Report Period */}
      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Reporting Period
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Select the period used to filter transaction records.
          </p>
        </div>

        <select
          value={period}
          onChange={(event) =>
            setPeriod(event.target.value as ReportPeriod)
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 sm:w-48"
          aria-label="Report period"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
</section>
      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="font-semibold hover:text-red-900"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading sales reports...
        </div>
      ) : !error ? (
        <>
          {/* Selected Period Indicator */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing report data for{" "}
              <span className="font-semibold text-slate-900">
                {periodLabels[period]}
              </span>
            </p>
          </div>

          {/* Summary Cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              title="Sales Revenue"
              value={money(totals.revenue)}
              description="Based on invoice dates"
              color="text-green-700"
            />

            <SummaryCard
              title="Sales Orders"
              value={String(filtered.orders.length)}
              description={`${money(totals.orderAmount)} total order value`}
              color="text-blue-700"
            />

            <SummaryCard
              title="Total Collections"
              value={money(totals.collected)}
              description="Based on payment dates"
              color="text-purple-700"
            />

            <SummaryCard
              title="Outstanding Receivables"
              value={money(totals.outstanding)}
              description="Current balance across all periods"
              color="text-orange-700"
            />

            <SummaryCard
              title="Sales Returns"
              value={money(totals.returned)}
              description="Based on return dates"
              color="text-red-700"
            />

            <SummaryCard
              title="Invoices Issued"
              value={String(filtered.invoices.length)}
              description="Based on invoice dates"
              color="text-indigo-700"
            />
          </section>

          {/* Report Summary */}
<section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
  <div className="border-b border-slate-200 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold text-slate-900">
        Report Summary
      </h2>

      <button
        type="button"
        onClick={exportCSV}
        disabled={loading || !!error}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true">↓</span>
        Export to CSV
      </button>
    </div>

    <p className="mt-1 text-sm text-slate-500">
      Overview of sales transactions and current receivables.
    </p>
  </div>
</section>


            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3">
                      Report
                    </th>
                    <th className="whitespace-nowrap px-5 py-3">
                      Date Basis
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-center">
                      Total Records
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-right">
                      Total Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {reportRows.map((row) => (
                    <tr
                      key={row.title}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                        {row.title}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {row.period}
                      </td>

                      <td className="px-5 py-4 text-center text-slate-700">
                        {row.count.toLocaleString("en-PH")}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-800">
                        {money(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-4 text-right font-semibold text-slate-700"
                    >
                      Total Transaction Amount
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-900">
                      {money(
                        totals.revenue +
                          totals.orderAmount +
                          totals.collected +
                          totals.returned
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex justify-end border-t border-slate-200 bg-white p-5">
          </div>

          <p className="text-xs text-slate-400">
            Note: Outstanding receivables show the current balance and are
            not filtered by the selected transaction period. The total
            transaction amount is a combined figure across different
            transaction types, not a separate accounting balance.
          </p>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  color,
}: {
  title: string;
  value: string;
  description: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}
