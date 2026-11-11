
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

type CustomerBalanceRow = {
  customer_id: number;
  customer_name: string;
  total_invoiced: number;
  total_paid: number;
  balance: number;
  invoice_count: number;
  status: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

const amount = (value: string | number) =>
  Number(value) || 0;

export default function CustomerBalancePage() {
  const [records, setRecords] = useState<CustomerBalanceRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        arData,
        invoiceData,
        orderData,
        customerData,
      ] = await Promise.all([
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

      const balances = new Map<number, CustomerBalanceRow>();

      arData.forEach((record: AccountsReceivable) => {
        const invoice = invoices.get(record.invoice_id);

        const order = invoice
          ? orders.get(invoice.order_id)
          : undefined;

        if (!order) return;

        const customer = customers.get(order.customer_id);

        if (!customer) return;

        const existing = balances.get(customer.customer_id);

        if (existing) {
          existing.total_invoiced += amount(record.amount_due);
          existing.total_paid += amount(record.amount_paid);
          existing.balance += amount(record.balance);
          existing.invoice_count += 1;
        } else {
          balances.set(customer.customer_id, {
            customer_id: customer.customer_id,
            customer_name: customer.name,
            total_invoiced: amount(record.amount_due),
            total_paid: amount(record.amount_paid),
            balance: amount(record.balance),
            invoice_count: 1,
            status: "Unpaid",
          });
        }
      });

      const rows = Array.from(balances.values()).map((customer) => {
        let status = "Unpaid";

        if (customer.balance <= 0) {
          status = "Paid";
        } else if (customer.total_paid > 0) {
          status = "Partially Paid";
        }

        return {
          ...customer,
          status,
        };
      });

      setRecords(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load customer balances."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        String(record.customer_id).includes(keyword) ||
        record.customer_name.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All" ||
        record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const totals = useMemo(
    () => ({
      invoiced: records.reduce(
        (sum, record) => sum + record.total_invoiced,
        0
      ),
      paid: records.reduce(
        (sum, record) => sum + record.total_paid,
        0
      ),
      balance: records.reduce(
        (sum, record) => sum + record.balance,
        0
      ),
      customers: records.length,
      unpaid: records.filter(
        (record) => record.balance > 0
      ).length,
    }),
    [records]
  );

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

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Sales Module
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Customer Balance
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Review each customer's total invoices, payments, and outstanding balance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Customers"
            value={String(totals.customers)}
            color="text-blue-600"
          />

          <SummaryCard
            title="Total Invoiced"
            value={money(totals.invoiced)}
            color="text-gray-900"
          />

          <SummaryCard
            title="Total Paid"
            value={money(totals.paid)}
            color="text-green-600"
          />

          <SummaryCard
            title="Outstanding Balance"
            value={money(totals.balance)}
            color="text-red-600"
          />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Customer Balance Records
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Consolidated balances from all accounts receivable records.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                placeholder="Search customer..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 sm:w-64"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Loading customer balances...
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Invoices</th>
                    <th className="px-4 py-3">Total Invoiced</th>
                    <th className="px-4 py-3">Total Paid</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.customer_id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium">
                        CUS-{record.customer_id}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {record.customer_name}
                      </td>

                      <td className="px-4 py-3">
                        {record.invoice_count}
                      </td>

                      <td className="px-4 py-3">
                        {money(record.total_invoiced)}
                      </td>

                      <td className="px-4 py-3 text-green-700">
                        {money(record.total_paid)}
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
                        colSpan={7}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        {search || statusFilter !== "All"
                          ? "No matching customer balances found."
                          : "No customer balance records yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:justify-between">
            <span>
              Showing {filteredRecords.length} of {records.length} customers
            </span>

            <span>
              Customers with outstanding balances: {totals.unpaid}
            </span>
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
