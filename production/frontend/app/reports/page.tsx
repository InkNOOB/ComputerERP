"use client";

import { useEffect, useState } from "react";

type StatusBreakdown = {
  status: string;
  total_runs: number;
};

type ProductionSummary = {
  total_production_runs: number;
  total_quantity_required: number;
  total_quantity_produced: number;
  remaining_quantity: number;
  status_breakdown: StatusBreakdown[];
};

export default function ReportsPage() {
  const [report, setReport] = useState<ProductionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/reports/production-summary/"
        );

        if (!response.ok) {
          throw new Error("Failed to retrieve production report.");
        }

        const data = await response.json();
        setReport(data);

      } catch (error) {
        console.error(error);
        setError("Unable to load production report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [refreshKey]);

  const summaryCards = [
    {
      title: "Total Production Runs",
      value: report?.total_production_runs ?? 0,
    },
    {
      title: "Total Quantity Required",
      value: report?.total_quantity_required ?? 0,
    },
    {
      title: "Total Quantity Produced",
      value: report?.total_quantity_produced ?? 0,
    },
    {
      title: "Remaining Quantity",
      value: report?.remaining_quantity ?? 0,
    },
  ];

  return (
    <div className="p-8 space-y-6">

      {/* PAGE HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Production Reports
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Monitor production performance and manufacturing progress.
          </p>
        </div>

        <button
          onClick={() => setRefreshKey((current) => current + 1)}
          className="px-4 py-2 rounded-lg bg-[#365f68] text-white text-sm hover:bg-[#294b53]"
        >
          Refresh
        </button>
      </div>

      {/* LOADING AND ERROR */}
      {loading ? (
        <p className="text-gray-500 py-8 text-center">
          Loading production report...
        </p>
      ) : error ? (
        <p className="text-red-500 py-8 text-center">
          {error}
        </p>
      ) : report && (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <p className="text-sm text-gray-500">
                  {card.title}
                </p>

                <h2 className="text-2xl font-bold text-gray-800 mt-3">
                  {card.value.toLocaleString()}
                </h2>
              </div>
            ))}

          </div>

          {/* PRODUCTION STATUS */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-800">
                Production Status Breakdown
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Number of production runs grouped by status.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">

                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3">Production Status</th>
                    <th className="p-3">Total Runs</th>
                  </tr>
                </thead>

                <tbody>
                  {report.status_breakdown.length > 0 ? (
                    report.status_breakdown.map((item) => (
                      <tr
                        key={item.status}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-3">
                          {item.status}
                        </td>

                        <td className="p-3 font-semibold">
                          {item.total_runs}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="p-8 text-center text-gray-500"
                      >
                        No production records found.
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>

          </div>
        </>
      )}

    </div>
  );
}