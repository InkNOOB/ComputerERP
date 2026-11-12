
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

const PAGE_SIZE = 10;

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

const amount = (value: string | number) => Number(value) || 0;

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value: string | null) => {
  if (!value) return "—";

  const dateOnly = value.slice(0, 10);
  const date = new Date(`${dateOnly}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-PH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const isOverdue = (record: ARRow, today: string) => {
  return (
    record.balance > 0 &&
    Boolean(record.due_date) &&
    record.due_date!.slice(0, 10) < today
  );
};

export default function AccountsReceivablePanel() {
  const [records, setRecords] = useState<ARRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
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
      setPage(1);
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

  const today = getLocalDate();

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return records;

    return records.filter((record) => {
      const overdue = isOverdue(record, today);

      return (
        String(record.AR_ID).includes(keyword) ||
        String(record.invoice_id).includes(keyword) ||
        record.customer_name.toLowerCase().includes(keyword) ||
        record.status.toLowerCase().includes(keyword) ||
        (overdue && "overdue".includes(keyword)) ||
        (record.due_date ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [records, search, today]);

  const totals = useMemo(
    () => ({
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
        (record) => record.balance > 0
      ).length,
      overdue: records.filter(
        (record) => isOverdue(record, today)
      ).length,
    }),
    [records, today]
  );

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

  const statusStyle = (status: string, overdue: boolean) => {
    if (overdue) {
      return "bg-red-100 text-red-700";
    }

    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";
      case "Partially Paid":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getDisplayStatus = (record: ARRow) => {
    if (isOverdue(record, today)) return "Overdue";
    return record.status;
  };

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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total Receivables"
          value={money(totals.amountDue)}
          color="text-blue-700"
        />
        <SummaryCard
          title="Amount Collected"
          value={money(totals.amountPaid)}
          color="text-green-700"
        />
        <SummaryCard
          title="Outstanding Balance"
          value={money(totals.balance)}
          color="text-red-700"
        />
        <SummaryCard
          title="Unpaid Accounts"
          value={String(totals.unpaid)}
          color="text-amber-700"
        />
        <SummaryCard
          title="Overdue Accounts"
          value={String(totals.overdue)}
          color="text-red-700"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Receivable Records
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              View invoice balances and payment status.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search AR, invoice, customer, or status..."
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
            Loading accounts receivable...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-center">AR No.</th>
                    <th className="px-4 py-3 text-center">Invoice No.</th>
                    <th className="px-4 py-3 text-center">Customer</th>
                    <th className="px-4 py-3 text-center">Due Date</th>
                    <th className="px-4 py-3 text-center">Amount Due</th>
                    <th className="px-4 py-3 text-center">Amount Paid</th>
                    <th className="px-4 py-3 text-center">Balance</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.map((record) => {
                    const overdue = isOverdue(record, today);

                    return (
                      <tr
                        key={record.AR_ID}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-center font-semibold text-slate-700 text-center">
                          AR-{record.AR_ID}
                        </td>

                        <td className="px-4 py-3 text-center font-medium text-blue-700 text-center">
                          INV-{record.invoice_id}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-800 text-center">
                          {record.customer_name}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-center">
                          {formatDate(record.due_date)}
                        </td>

                        <td className="px-4 py-3 tabular-nums text-slate-700 text-center">
                          {money(record.amount_due)}
                        </td>

                        <td className="px-4 py-3 tabular-nums text-green-700 text-center">
                          {money(record.amount_paid)}
                        </td>

                        <td className="px-4 py-3 text-center font-semibold tabular-nums text-slate-900">
                          {money(record.balance)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                              record.status,
                              overdue
                            )}`}
                          >
                            {getDisplayStatus(record)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        {search
                          ? "No matching receivable records found."
                          : "No accounts receivable records yet."}
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
                records
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
