
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  paymentCollectionAPI,
  salesOrderAPI,
  invoiceAPI,
  accountsReceivableAPI,
  salesReturnAPI,
} from "../lib/api";

import type { Collection } from "../types/payment";
import type { SalesOrder, SalesOrderItem } from "../types/order";
import type { SalesInvoice } from "../types/invoice";
import type { AccountsReceivable } from "../types/accounts-receivable";
import type { SalesReturn } from "../types/return";

const PAGE_TITLE = "Sales Analytics";

const money = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);

  return `₱${(Number.isFinite(amount) ? amount : 0).toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
};

const numberValue = (value: string | number | null | undefined) => {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const datePart = value.split("T")[0];
  const date = new Date(`${datePart}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getMonthKey = (value: string) => value.split("T")[0].slice(0, 7);

const getLastSixMonths = () => {
  const months: { key: string; label: string }[] = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - i,
      1
    );

    months.push({
      key: `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-PH", {
        month: "short",
        year: "2-digit",
      }),
    });
  }

  return months;
};

const cardClass =
  "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";

export default function DashboardPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [items, setItems] = useState<SalesOrderItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        orderData,
        invoiceData,
        collectionData,
        receivableData,
        returnData,
        itemData,
      ] = await Promise.all([
        salesOrderAPI.getAll(),
        invoiceAPI.getAll(),
        paymentCollectionAPI.getAll(),
        accountsReceivableAPI.getAll(),
        salesReturnAPI.getAll(),
        salesOrderAPI.getItems(""),
      ]);

      setOrders(orderData);
      setInvoices(invoiceData);
      setCollections(collectionData);
      setReceivables(receivableData);
      setReturns(returnData);
      setItems(itemData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load sales analytics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const analytics = useMemo(() => {
    const totalSales = invoices.reduce(
      (sum, invoice) => sum + numberValue(invoice.total_due),
      0
    );

    const totalCollections = collections.reduce(
      (sum, collection) => sum + numberValue(collection.amount_paid),
      0
    );

    const outstandingBalance = receivables.reduce(
      (sum, record) => sum + numberValue(record.balance),
      0
    );

    const totalReturns = returns.reduce(
      (sum, record) => sum + numberValue(record.return_amount),
      0
    );

    const activeOrders = orders.filter(
      (order) => order.status !== "Cancelled"
    );

    const orderStatuses = [
      "Pending",
      "Approved",
      "Processing",
      "Completed",
      "Cancelled",
    ].map((status) => ({
      status,
      count: orders.filter((order) => order.status === status).length,
    }));

    const overdueAccounts = receivables.filter(
      (record) =>
        numberValue(record.balance) > 0 &&
        record.status?.toLowerCase() === "overdue"
    ).length;

    return {
      totalSales,
      totalCollections,
      outstandingBalance,
      totalReturns,
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      orderStatuses,
      overdueAccounts,
    };
  }, [orders, invoices, collections, receivables, returns]);

  const monthlyAnalytics = useMemo(() => {
    const months = getLastSixMonths();

    return months.map((month) => {
      const monthlySales = invoices
        .filter(
          (invoice) =>
            getMonthKey(invoice.invoice_date) === month.key
        )
        .reduce(
          (sum, invoice) => sum + numberValue(invoice.total_due),
          0
        );

      const monthlyCollections = collections
        .filter(
          (collection) =>
            getMonthKey(collection.payment_date) === month.key
        )
        .reduce(
          (sum, collection) =>
            sum + numberValue(collection.amount_paid),
          0
        );

      return {
        ...month,
        sales: monthlySales,
        collections: monthlyCollections,
      };
    });
  }, [invoices, collections]);

  const topProducts = useMemo(() => {
    const productMap = new Map<
      number,
      {
        IM_ID: number;
        name: string;
        sku: string;
        quantity: number;
        sales: number;
      }
    >();

    const detailMap = new Map<
      number,
      { IM_ID: number; quantity: number; lineTotal: number }
    >();

    const itemMap = new Map(
      items.map((item) => [item.IM_ID, item])
    );

    const returnedQuantities = new Map<number, number>();
    const returnedAmounts = new Map<number, number>();

    returns.forEach((record) => {
      const detailId = record.Order_Detail_ID;

      returnedQuantities.set(
        detailId,
        (returnedQuantities.get(detailId) ?? 0) +
          numberValue(record.quantity)
      );

      returnedAmounts.set(
        detailId,
        (returnedAmounts.get(detailId) ?? 0) +
          numberValue(record.return_amount)
      );
    });

    orders
      .filter((order) => order.status !== "Cancelled")
      .forEach((order) => {
        order.details?.forEach((detail) => {
          detailMap.set(detail.order_detail_id, {
            IM_ID: detail.IM_ID,
            quantity: numberValue(detail.quantity),
            lineTotal: numberValue(detail.line_total),
          });
        });
      });

    detailMap.forEach((detail, detailId) => {
      const item = itemMap.get(detail.IM_ID);
      const returnedQty = returnedQuantities.get(detailId) ?? 0;
      const returnedAmount = returnedAmounts.get(detailId) ?? 0;

      const netQuantity = Math.max(0, detail.quantity - returnedQty);
      const netSales = Math.max(0, detail.lineTotal - returnedAmount);

      const existing = productMap.get(detail.IM_ID);

      if (existing) {
        existing.quantity += netQuantity;
        existing.sales += netSales;
      } else {
        productMap.set(detail.IM_ID, {
          IM_ID: detail.IM_ID,
          name: item?.Item_Name ?? `Item #${detail.IM_ID}`,
          sku: item?.SKU ?? "—",
          quantity: netQuantity,
          sales: netSales,
        });
      }
    });

    return Array.from(productMap.values())
      .filter((product) => product.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders, items, returns]);

  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort(
        (a, b) =>
          new Date(b.invoice_date).getTime() -
          new Date(a.invoice_date).getTime()
      )
      .slice(0, 5);
  }, [invoices]);

  // Line graph dimensions and coordinates
  const chartWidth = 600;
const chartHeight = 200;

const chartPadding = {
  top: 15,
  right: 20,
  bottom: 35,
  left: 70,
};

  const maxMonthlyValue = Math.max(
    1,
    ...monthlyAnalytics.flatMap((month) => [
      month.sales,
      month.collections,
    ])
  );

  const chartX = (index: number) =>
    chartPadding.left +
    (index *
      (chartWidth - chartPadding.left - chartPadding.right)) /
      Math.max(monthlyAnalytics.length - 1, 1);

  const chartY = (value: number) =>
    chartHeight -
    chartPadding.bottom -
    (value / maxMonthlyValue) *
      (chartHeight - chartPadding.top - chartPadding.bottom);

  const salesLine = monthlyAnalytics
    .map((month, index) => `${chartX(index)},${chartY(month.sales)}`)
    .join(" ");

  const collectionsLine = monthlyAnalytics
    .map(
      (month, index) =>
        `${chartX(index)},${chartY(month.collections)}`
    )
    .join(" ");

  const chartAxisLabels = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="min-h-full space-y-6 bg-#8FB1B8-50 p-4 sm:p-6">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {PAGE_TITLE}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of sales performance and financial activities.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Unable to load dashboard data</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={cardClass}>
          <p className="text-sm font-medium text-slate-500">
            Total Sales
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? "—" : money(analytics.totalSales)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Based on sales invoices
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-sm font-medium text-slate-500">
            Total Orders
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? "—" : analytics.totalOrders.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {analytics.activeOrders} non-cancelled orders
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-sm font-medium text-slate-500">
            Outstanding Balance
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {loading ? "—" : money(analytics.outstandingBalance)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Remaining accounts receivable
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-sm font-medium text-slate-500">
            Total Collections
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {loading ? "—" : money(analytics.totalCollections)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Recorded customer payments
          </p>
        </div>
      </div>

      {/* Sales Performance - Line Graph */}
      <section className={cardClass}>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Sales Performance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Monthly sales and collections for the last six months.
          </p>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading sales performance...
          </p>
        ) : monthlyAnalytics.every(
            (month) => month.sales === 0 && month.collections === 0
          ) ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No sales or collection records available for this period.
          </p>
        ) : (
          <>
            {/* Graph Legend */}
            <div className="mb-4 flex flex-wrap gap-5 text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-3 w-3 rounded-full bg-blue-600" />
                Sales
              </span>

              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                Collections
              </span>
            </div>

            {/* Line Graph */}
            <div className="mx-auto w-full max-w-[650px]">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="mx-auto h-auto w-full max-w-[650px]"
                role="img"
                aria-label="Line graph showing monthly sales and collections for the last six months"
              >
                {/* Horizontal grid lines and peso labels */}
                {chartAxisLabels.map((ratio) => {
                  const value = maxMonthlyValue * ratio;
                  const y = chartY(value);

                  return (
                    <g key={ratio}>
                      <line
                        x1={chartPadding.left}
                        y1={y}
                        x2={chartWidth - chartPadding.right}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                      />

                      <text
                        x={chartPadding.left - 10}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="11"
                        fill="#64748b"
                      >
                        {value >= 1000
                          ? `₱${(value / 1000).toFixed(0)}k`
                          : `₱${value.toFixed(0)}`}
                      </text>
                    </g>
                  );
                })}

                {/* Sales Line */}
                <polyline
                  points={salesLine}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Collections Line */}
                <polyline
                  points={collectionsLine}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points and Month Labels */}
                {monthlyAnalytics.map((month, index) => (
                  <g key={month.key}>
                    {/* Sales Point */}
                    <circle
                      cx={chartX(index)}
                      cy={chartY(month.sales)}
                      r="5"
                      fill="#2563eb"
                      stroke="white"
                      strokeWidth="2"
                    >
                      <title>
                        {month.label} Sales: {money(month.sales)}
                      </title>
                    </circle>

                    {/* Collections Point */}
                    <circle
                      cx={chartX(index)}
                      cy={chartY(month.collections)}
                      r="5"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="2"
                    >
                      <title>
                        {month.label} Collections: {money(month.collections)}
                      </title>
                    </circle>

                    {/* Month Label */}
                    <text
                      x={chartX(index)}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#64748b"
                    >
                      {month.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Monthly Totals */}
            <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">
                  Sales in displayed period
                </p>
                <p className="mt-1 font-semibold text-blue-700">
                  {money(
                    monthlyAnalytics.reduce(
                      (sum, month) => sum + month.sales,
                      0
                    )
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Collections in displayed period
                </p>
                <p className="mt-1 font-semibold text-emerald-700">
                  {money(
                    monthlyAnalytics.reduce(
                      (sum, month) => sum + month.collections,
                      0
                    )
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Top Selling Products */}
      <section className={cardClass}>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Top Selling Products
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Products ranked by net quantity sold, after recorded returns.
          </p>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading product analytics...
          </p>
        ) : topProducts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No product sales records available yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-center">Product</th>
                  <th className="px-4 py-3 text-center">SKU</th>
                  <th className="px-4 py-3 text-center">
                    Quantity Sold
                  </th>
                  <th className="px-4 py-3 text-center">
                    Net Sales
                  </th>
                </tr>
              </thead>

              <tbody>
                {topProducts.map((product, index) => (
                  <tr
                    key={product.IM_ID}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-500 ">
                      #{index + 1}
                    </td>

                    <td className="px-4 py-4 text-center ">
                      <p className="font-semibold text-slate-800 text-center">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500 text-center">
                        Item ID: {product.IM_ID}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-slate-600 text-center">
                      {product.sku}
                    </td>

                    <td className="px-4 py-4 text-center font-semibold text-slate-800">
                      {product.quantity.toLocaleString()}
                    </td>

                    <td className="px-4 py-4 text-center font-semibold text-slate-800">
                      {money(product.sales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Order Status and Financial Overview */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className={cardClass}>
          <h2 className="text-lg font-bold text-slate-900">
            Sales Order Status
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Current distribution of sales orders.
          </p>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading order statuses...
            </p>
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No sales orders available.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {analytics.orderStatuses.map((item) => {
                const percentage =
                  analytics.totalOrders > 0
                    ? (item.count / analytics.totalOrders) * 100
                    : 0;

                const statusColors: Record<string, string> = {
                  Pending: "bg-amber-500",
                  Approved: "bg-blue-500",
                  Processing: "bg-indigo-500",
                  Completed: "bg-emerald-500",
                  Cancelled: "bg-red-500",
                };

                return (
                  <div key={item.status}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {item.status}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {item.count}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          statusColors[item.status]
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className={cardClass}>
          <h2 className="text-lg font-bold text-slate-900">
            Financial Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Summary of recorded sales and payment activity.
          </p>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">
                Total Sales
              </span>
              <span className="font-semibold text-slate-900">
                {loading ? "—" : money(analytics.totalSales)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">
                Total Collections
              </span>
              <span className="font-semibold text-emerald-700">
                {loading ? "—" : money(analytics.totalCollections)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">
                Outstanding Balance
              </span>
              <span className="font-semibold text-amber-600">
                {loading ? "—" : money(analytics.outstandingBalance)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">
                Total Sales Returns
              </span>
              <span className="font-semibold text-red-600">
                {loading ? "—" : money(analytics.totalReturns)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Overdue Accounts
              </span>
              <span className="font-semibold text-red-600">
                {loading ? "—" : analytics.overdueAccounts}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Sales Invoices */}
      <section className={cardClass}>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Recent Sales Invoices
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            The five most recently issued sales invoices.
          </p>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading recent invoices...
          </p>
        ) : recentInvoices.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No sales invoices available yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Invoice ID</th>
                  <th className="px-4 py-3 text-center">Order ID</th>
                  <th className="px-4 py-3 text-center">Invoice Date</th>
                  <th className="px-4 py-3 text-center">Total Due</th>
                </tr>
              </thead>

              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr
                    key={invoice.invoice_id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-semibold text-blue-700 text-left">
                      #{invoice.invoice_id}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-center">
                      #{invoice.order_id}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-center">
                      {formatDate(invoice.invoice_date)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800 text-center">
                      {money(invoice.total_due)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
