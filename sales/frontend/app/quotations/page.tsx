
"use client";

import { useEffect, useMemo, useState } from "react";
import { request } from "@/lib/api";
import type {
  SalesQuotation,
  QuotationStatus,
} from "@/types/quotation";

const statuses: Array<"All" | QuotationStatus> = [
  "All",
  "Draft",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
];

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<SalesQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | QuotationStatus
  >("All");

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await request<SalesQuotation[]>("/api/quotations");
      setQuotations(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load quotations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchQuotations();
  }, []);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((quotation) => {
      const matchesSearch =
        quotation.quotation_id.toString().includes(search) ||
        quotation.customer_id.toString().includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        quotation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, search, statusFilter]);

  const totalAmount = quotations.reduce(
    (sum, quotation) => sum + Number(quotation.total_amount),
    0
  );

  const getStatusStyle = (status: QuotationStatus) => {
    const styles: Record<QuotationStatus, string> = {
      Draft: "bg-gray-100 text-gray-700",
      Sent: "bg-blue-100 text-blue-700",
      Accepted: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
      Expired: "bg-orange-100 text-orange-700",
    };

    return styles[status];
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sales Quotation
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Prepare and manage price quotations for customers.
          </p>
        </div>

        <button
          type="button"
          disabled
          title="Quotation creation will be implemented next"
          className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white opacity-60"
        >
          + Create Quotation
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Quotations"
          value={quotations.length.toString()}
        />

        <SummaryCard
          title="Draft"
          value={quotations.filter((q) => q.status === "Draft").length.toString()}
        />

        <SummaryCard
          title="Accepted"
          value={quotations.filter((q) => q.status === "Accepted").length.toString()}
        />

        <SummaryCard
          title="Total Quotation Value"
          value={formatCurrency(totalAmount)}
        />
      </div>

      {/* Quotation Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Quotation Records
            </h2>
            <p className="text-sm text-gray-500">
              View and manage customer quotations.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchQuotations}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <input
            type="text"
            placeholder="Search quotation ID or customer ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "All" | QuotationStatus)
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All Statuses" : status}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading quotations...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={fetchQuotations}
              className="mt-3 text-sm font-medium text-green-700 hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Quotation No.</th>
                  <th className="px-5 py-3">Customer ID</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredQuotations.map((quotation) => (
                  <tr
                    key={quotation.quotation_id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium text-gray-900">
                      QT-{String(quotation.quotation_id).padStart(4, "0")}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      #{quotation.customer_id}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(quotation.quotation_date)}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {quotation.details.length}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900">
                      {formatCurrency(Number(quotation.total_amount))}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                          quotation.status
                        )}`}
                      >
                        {quotation.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredQuotations.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      No quotations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
            Showing {filteredQuotations.length} of {quotations.length} quotations
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-2 text-xl font-bold text-gray-900">
        {value}
      </h3>
    </div>
  );
}
