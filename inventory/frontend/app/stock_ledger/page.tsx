
"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboardlayout";

interface StockLedger {
  log_id: number;
  im_id: number;
  sku: string;
  item_name: string;
  wh_id: number;
  warehouse_name: string;
  target_wh_id: number | null;
  target_warehouse_name: string | null;
  transaction_type: string;
  quantity: number;
  actual_quantity: number | null;
  reference_no: string | null;
  logged_by: string;
  approved_by: string | null;
  log_date: string;
  remarks: string | null;
}

interface LedgerSummary {
  total_transactions: number;
  total_stock_in: number;
  total_stock_out: number;
  total_adjustments: number;
  total_transfers: number;
}

export default function StockLedgerPage() {
  const [transactions, setTransactions] = useState<StockLedger[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
  useState<StockLedger | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [summary, setSummary] = useState<LedgerSummary>({
    total_transactions: 0,
    total_stock_in: 0,
    total_stock_out: 0,
    total_adjustments: 0,
    total_transfers: 0,
  });


  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const totalPages = Math.ceil(transactions.length / itemsPerPage);

const paginatedTransactions = transactions.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

  const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("All");
    const [selectedDate, setSelectedDate] = useState("Last 7 Days");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");


  
  const getDateRange = () => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    if (selectedDate === "All Time") {
      return { start: "", end: "" };
    } else if (selectedDate === "Today") {
      // Current day
    } else if (selectedDate === "Last 7 Days") {
      start.setDate(today.getDate() - 6);
    } else if (selectedDate === "This Week") {
      const day = today.getDay();
      const difference = day === 0 ? 6 : day - 1;
      start.setDate(today.getDate() - difference);
    } else if (selectedDate === "This Month") {
      start.setDate(1);
    } else if (selectedDate === "Last Month") {
      start.setDate(1);
      start.setMonth(today.getMonth() - 1);
      end.setDate(0);
    } else if (selectedDate === "Custom Range") {
      return {
        start: startDate,
        end: endDate,
      };
    }

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDate(start),
      end: formatDate(end),
    };
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchTransactions();
    fetchSummary();
  }, [selectedDate, startDate, endDate, selectedType, searchTerm]);

  
const fetchTransactions = async () => {
  try {
    const params = new URLSearchParams();
    const range = getDateRange();

    if (range.start) params.append("start_date", range.start);
    if (range.end) params.append("end_date", range.end);

    if (selectedType !== "All") {
      params.append("transaction_type", selectedType);
    }

    if (searchTerm.trim()) {
      params.append("search", searchTerm.trim());
    }

    const response = await fetch(
      `${API_URL}/stock_ledger/?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch stock transactions");
    }

    const data = await response.json();
    setTransactions(data);
  } catch (error) {
    console.error("Error fetching stock transactions:", error);
  }
};


  
const fetchSummary = async () => {
  try {
    const params = new URLSearchParams();
    const range = getDateRange();

    if (range.start) params.append("start_date", range.start);
    if (range.end) params.append("end_date", range.end);

    const response = await fetch(
      `${API_URL}/stock_ledger/summary?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch stock summary");
    }

    const data = await response.json();
    setSummary(data);
  } catch (error) {
    console.error("Error fetching stock summary:", error);
  }
};

  return (
  <DashboardLayout title="Stock Ledger">
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F3338]">
          Stock Ledger
        </h1>
        <p className="mt-1 text-sm text-[#587176]">
          Track and review completed inventory transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-[#DCE7EA] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#587176]">
            Total Transactions
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#1F3338]">
            {summary.total_transactions}
          </h2>
        </div>

        <div className="rounded-xl border border-[#DCE7EA] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#587176]">
            Total Stock In
          </p>
          <h2 className="mt-2 text-2xl font-bold text-green-700">
            {summary.total_stock_in}
          </h2>
        </div>

        <div className="rounded-xl border border-[#DCE7EA] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#587176]">
            Total Stock Out
          </p>
          <h2 className="mt-2 text-2xl font-bold text-red-600">
            {summary.total_stock_out}
          </h2>
        </div>

        <div className="rounded-xl border border-[#DCE7EA] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#587176]">
            Total Adjustments
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#24363B]">
            {summary.total_adjustments}
          </h2>
        </div>

        <div className="rounded-xl border border-[#DCE7EA] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#587176]">
            Total Transfers
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#35636B]">
            {summary.total_transfers}
          </h2>
        </div>
        </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#DCE7EA] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#1F3338]">
            Transaction History
          </h2>
          <p className="text-sm text-[#587176]">
            Search and filter your stock transactions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1F3338]">
              Search
            </label>
            <input
              type="text"
              placeholder="Search item, SKU, warehouse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#B8CDD1] bg-white p-3 text-sm text-[#1F3338] placeholder:text-[#587176] outline-none focus:border-[#35636B] focus:ring-1 focus:ring-[#35636B]"
            />
          </div>

          {/* Transaction Type */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1F3338]">
              Transaction Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-[#B8CDD1] bg-white p-3 text-sm text-[#1F3338] outline-none focus:border-[#35636B] focus:ring-1 focus:ring-[#35636B]"
            >
              <option value="All">All Transactions</option>
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
              <option value="STOCK_ADJUSTMENT">Adjustment</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1F3338]">
              Date Range
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-[#B8CDD1] bg-white p-3 text-sm text-[#1F3338] outline-none focus:border-[#35636B] focus:ring-1 focus:ring-[#35636B]"
            >
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="Custom Range">Custom Range</option>
              <option value="All Time">All Time</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {selectedDate === "Custom Range" && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1F3338]">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-[#B8CDD1] bg-white p-3 text-sm text-[#1F3338] outline-none focus:border-[#35636B] focus:ring-1 focus:ring-[#35636B]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1F3338]">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-[#B8CDD1] bg-white p-3 text-sm text-[#1F3338] outline-none focus:border-[#35636B] focus:ring-1 focus:ring-[#35636B]"
              />
            </div>
          </div>
        )}
      </div>


      {/* Transaction Table */}
      <div className="overflow-hidden rounded-xl border border-[#DCE7EA] bg-white shadow-sm">
        <div className="border-b border-[#DCE7EA] p-5">
          <h2 className="text-lg font-bold text-[#1F3338]">
            Transaction Records
          </h2>
          <p className="mt-1 text-sm text-[#587176]">
            List of completed inventory transactions.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-[#E5F0F1] text-[#1F3338]">
              <tr>
                <th className="p-4 font-bold">ID</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Item</th>
                <th className="p-4 font-bold">Transaction Type</th>
                <th className="p-4 font-bold">Warehouse</th>
                <th className="p-4 font-bold">Quantity</th>
                <th className="p-4 font-bold">Reference No.</th>
                <th className="p-4 font-bold">Logged By</th>
                <th className="p-4 font-bold">Approved By</th>
                <th className="p-4 font-bold">Action</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length > 0 ? (
                paginatedTransactions.map((transaction) => (
                  <tr
                    key={transaction.log_id}
                    className="border-t border-[#DCE7EA] text-[#1F3338] transition-colors hover:bg-[#F2F7F8]"
                  >
                    <td className="p-4">{transaction.log_id}</td>

                    <td className="p-4 whitespace-nowrap">
                      {new Date(transaction.log_date).toLocaleString()}
                    </td>

                    <td className="p-4">
                      <p className="font-semibold">
                        {transaction.item_name}
                      </p>
                      <p className="text-xs text-[#587176]">
                        {transaction.sku}
                      </p>
                    </td>

                    <td className="p-4">
                      {transaction.transaction_type.replaceAll("_", " ")}
                    </td>

                    <td className="p-4">
                      <p>{transaction.warehouse_name}</p>
                      {transaction.target_warehouse_name && (
                        <p className="mt-1 text-xs text-[#587176]">
                          To: {transaction.target_warehouse_name}
                        </p>
                      )}
                    </td>

                    <td className="p-4 font-semibold">
                      {transaction.actual_quantity ?? transaction.quantity}
                    </td>

                    <td className="p-4">
                      {transaction.reference_no || "—"}
                    </td>

                    <td className="p-4">{transaction.logged_by}</td>

                    <td className="p-4">
                      {transaction.approved_by || "—"}
                    </td>
                    <td className="p-4">
                    <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="rounded-lg bg-[#E5F0F1] px-3 py-2 text-sm font-bold text-[#24363B] transition-colors hover:bg-[#D5E7E9]"
                    >
                        View Details
                    </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="p-10 text-center text-[#587176]"
                  >
                    No stock transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
            
      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-[#DCE7EA] bg-white p-4 sm:flex-row">
        <p className="text-sm text-[#587176]">
          Showing{" "}
          {transactions.length === 0
            ? 0
            : (currentPage - 1) * itemsPerPage + 1}
          {" "}to{" "}
          {Math.min(currentPage * itemsPerPage, transactions.length)}
          {" "}of {transactions.length} transactions
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-[#B8CDD1] px-4 py-2 text-sm font-semibold text-[#24363B] transition-colors hover:bg-[#F2F7F8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="px-3 text-sm font-semibold text-[#1F3338]">
            Page {currentPage} of {Math.max(totalPages, 1)}
          </span>

          <button
            onClick={() =>
              setCurrentPage((page) => Math.min(page + 1, totalPages))
            }
            disabled={currentPage >= totalPages || totalPages === 0}
            className="rounded-lg border border-[#B8CDD1] px-4 py-2 text-sm font-semibold text-[#24363B] transition-colors hover:bg-[#F2F7F8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE7EA] p-5">
              <div>
                <h2 className="text-xl font-bold text-[#1F3338]">
                  Transaction Details
                </h2>
                <p className="mt-1 text-sm text-[#587176]">
                  Transaction ID: #{selectedTransaction.log_id}
                </p>
              </div>

              <button
                onClick={() => setSelectedTransaction(null)}
                className="rounded-lg px-3 py-2 text-xl font-bold text-[#587176] hover:bg-[#F2F7F8]"
                aria-label="Close transaction details"
              >
                ×
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  Item Name
                </p>
                <p className="mt-1 font-semibold text-[#1F3338]">
                  {selectedTransaction.item_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  SKU
                </p>
                <p className="mt-1 text-[#1F3338]">
                  {selectedTransaction.sku}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  Transaction Type
                </p>
                <p className="mt-1 font-semibold text-[#35636B]">
                  {selectedTransaction.transaction_type.replaceAll("_", " ")}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  Date and Time
                </p>
                <p className="mt-1 text-[#1F3338]">
                  {new Date(selectedTransaction.log_date).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  Source Warehouse
                </p>
                <p className="mt-1 text-[#1F3338]">
                  {selectedTransaction.warehouse_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  Destination Warehouse
                </p>
                <p className="mt-1 text-[#1F3338]">
                  {selectedTransaction.target_warehouse_name || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  Quantity
                </p>
                <p className="mt-1 text-[#1F3338]">
                  {selectedTransaction.quantity}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  Actual Quantity
                </p>
                <p className="mt-1 text-[#1F3338]">
                  {selectedTransaction.actual_quantity ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  Reference Number
                </p>
                <p className="mt-1 text-[#1F3338]">
                  {selectedTransaction.reference_no || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  Logged By
                </p>
                <p className="mt-1 text-[#1F3338]">
                  {selectedTransaction.logged_by}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  Approved By
                </p>
                <p className="mt-1 text-[#1F3338]">
                  {selectedTransaction.approved_by || "—"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase text-[#587176]">
                  Remarks
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[#1F3338]">
                  {selectedTransaction.remarks || "No remarks provided."}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#DCE7EA] p-5">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="rounded-lg bg-[#365f68] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#668d98]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>    
    </DashboardLayout>
  );
}
