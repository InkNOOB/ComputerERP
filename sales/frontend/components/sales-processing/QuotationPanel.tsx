
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { quotationAPI } from "@/lib/api";

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

const PAGE_SIZE = 10;

export default function QuotationPanel() {
  const [quotations, setQuotations] = useState<SalesQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | QuotationStatus>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [savingQuotationId, setSavingQuotationId] = useState<number | null>(
    null
  );

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await quotationAPI.getAll();
      setQuotations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load quotations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchQuotations();
  }, [fetchQuotations]);

  const filteredQuotations = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return quotations.filter((quotation) => {
      const matchesSearch =
        quotation.quotation_id.toString().includes(searchTerm) ||
        quotation.customer_id.toString().includes(searchTerm);

      const matchesStatus =
        statusFilter === "All" || quotation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuotations.length / PAGE_SIZE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedQuotations = filteredQuotations.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  const totalAmount = quotations.reduce(
    (sum, quotation) => sum + (Number(quotation.total_amount) || 0),
    0
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  const formatDate = (date: string) => {
    if (!date) return "—";

    const dateOnly = date.split("T")[0];
    const [year, month, day] = dateOnly.split("-").map(Number);

    const parsedDate =
      year && month && day
        ? new Date(year, month - 1, day)
        : new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusStyle = (status: QuotationStatus) => {
    const styles: Record<QuotationStatus, string> = {
      Draft: "bg-slate-100 text-slate-700",
      Sent: "bg-blue-100 text-blue-700",
      Accepted: "bg-emerald-100 text-emerald-700",
      Rejected: "bg-rose-100 text-rose-700",
      Expired: "bg-amber-100 text-amber-700",
    };

    return styles[status];
  };

  const handleStatusChange = async (
    quotationId: number,
    newStatus: QuotationStatus
  ) => {
    try {
      setSavingQuotationId(quotationId);
      setActionError("");

      const updatedQuotation = await quotationAPI.updateStatus(
        quotationId,
        newStatus
      );

      setQuotations((previous) =>
        previous.map((quotation) =>
          quotation.quotation_id === quotationId
            ? updatedQuotation
            : quotation
        )
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to update quotation status."
      );
    } finally {
      setSavingQuotationId(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: "All" | QuotationStatus) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const draftCount = quotations.filter(
    (quotation) => quotation.status === "Draft"
  ).length;

  const acceptedCount = quotations.filter(
    (quotation) => quotation.status === "Accepted"
  ).length;

  return (
    <div className="min-w-0 space-y-5">
      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Quotations"
          value={quotations.length.toString()}
          description="All quotation records"
        />

        <SummaryCard
          title="Draft Quotations"
          value={draftCount.toString()}
          description="Quotations not yet sent"
        />

        <SummaryCard
          title="Accepted Quotations"
          value={acceptedCount.toString()}
          description="Quotations accepted by customers"
        />

        <SummaryCard
          title="Total Quotation Value"
          value={formatCurrency(totalAmount)}
          description="Combined value of all quotations"
        />
      </section>

      {/* Quotation Records */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-bold text-slate-900">
            Quotation Records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View quotations and update their current status.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <input
            type="search"
            placeholder="Search quotation ID or customer ID..."
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              handleFilterChange(
                event.target.value as "All" | QuotationStatus
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All Statuses" : status}
              </option>
            ))}
          </select>
        </div>

        {/* Status Update Error */}
        {actionError && (
          <div className="mx-4 mb-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading quotations...
          </div>
        )}

        {/* Loading Error */}
        {!loading && error && (
          <div className="p-8 text-center">
            <p className="text-sm text-rose-600">{error}</p>

            <button
              type="button"
              onClick={() => void fetchQuotations()}
              className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Quotation No.
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Customer ID
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Quotation Date
                    </th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Items
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Total Amount
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedQuotations.map((quotation) => (
                    <tr
                      key={quotation.quotation_id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        QT-{String(quotation.quotation_id).padStart(4, "0")}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        #{quotation.customer_id}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(quotation.quotation_date)}
                      </td>

                      <td className="px-5 py-4 text-center text-slate-600">
                        {quotation.details?.length ?? 0}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-900">
                        {formatCurrency(Number(quotation.total_amount) || 0)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              quotation.status
                            )}`}
                          >
                            {quotation.status}
                          </span>

                          <select
                            aria-label={`Update status for quotation ${quotation.quotation_id}`}
                            value={quotation.status}
                            disabled={
                              savingQuotationId === quotation.quotation_id
                            }
                            onChange={(event) =>
                              void handleStatusChange(
                                quotation.quotation_id,
                                event.target.value as QuotationStatus
                              )
                            }
                            className="max-w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600 disabled:cursor-wait disabled:opacity-60"
                          >
                            {statuses
                              .filter((status) => status !== "All")
                              .map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                          </select>

                          {savingQuotationId === quotation.quotation_id && (
                            <span className="text-xs text-blue-600">
                              Saving...
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredQuotations.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        {quotations.length === 0
                          ? "No quotation records available."
                          : "No quotations match your search or selected filter."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing{" "}
                {filteredQuotations.length === 0
                  ? 0
                  : (safeCurrentPage - 1) * PAGE_SIZE + 1}{" "}
                to{" "}
                {Math.min(safeCurrentPage * PAGE_SIZE, filteredQuotations.length)}{" "}
                of {filteredQuotations.length} quotations
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="px-2 text-xs font-medium text-slate-600">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-600">{title}</p>

      <h3 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </h3>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}
