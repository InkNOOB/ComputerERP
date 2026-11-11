
"use client";

import { useState } from "react";
import QuotationPanel from "../../components/sales-processing/QuotationPanel";
import OrderPanel from "../../components/sales-processing/OrderPanel";

type SalesTab = "quotations" | "orders";

export default function SalesProcessingPage() {
  const [activeTab, setActiveTab] = useState<SalesTab>("quotations");

  const tabClass = (tab: SalesTab) =>
    `rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${
      activeTab === tab
        ? "bg-blue-700 text-white shadow-sm"
        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
    }`;

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 sm:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Sales processing sections"
          className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
        >
          <button
            id="quotations-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === "quotations"}
            aria-controls="quotations-panel"
            onClick={() => setActiveTab("quotations")}
            className={tabClass("quotations")}
          >
            Sales Quotation
          </button>

          <button
            id="orders-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === "orders"}
            aria-controls="orders-panel"
            onClick={() => setActiveTab("orders")}
            className={tabClass("orders")}
          >
            Sales Order
          </button>
        </div>

        {/* Active Panel */}
        {activeTab === "quotations" && (
          <section
            id="quotations-panel"
            role="tabpanel"
            aria-labelledby="quotations-tab"
            className="min-w-0"
          >
            <QuotationPanel />
          </section>
        )}

        {activeTab === "orders" && (
          <section
            id="orders-panel"
            role="tabpanel"
            aria-labelledby="orders-tab"
            className="min-w-0"
          >
            <OrderPanel />
          </section>
        )}
      </div>
    </div>
  );
}
