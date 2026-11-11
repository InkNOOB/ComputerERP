
"use client";

import { useState } from "react";
import DeliveryPanel from "../../components/delivery-returns/DeliveryPanel";
import ReturnsPanel from "../../components/delivery-returns/ReturnsPanel";

type DeliveryReturnsTab = "deliveries" | "returns";

export default function DeliveryReturnsPage() {
  const [activeTab, setActiveTab] =
    useState<DeliveryReturnsTab>("deliveries");

  const tabClass = (tab: DeliveryReturnsTab) =>
    `rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${
      activeTab === tab
        ? "bg-blue-700 text-white shadow-sm"
        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
    }`;

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 sm:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">

        <div
          role="tablist"
          aria-label="Delivery and returns sections"
          className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
        >
          <button
            id="deliveries-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === "deliveries"}
            aria-controls="deliveries-panel"
            onClick={() => setActiveTab("deliveries")}
            className={tabClass("deliveries")}
          >
            Delivery
          </button>

          <button
            id="returns-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === "returns"}
            aria-controls="returns-panel"
            onClick={() => setActiveTab("returns")}
            className={tabClass("returns")}
          >
            Sales Return
          </button>
        </div>

        {activeTab === "deliveries" && (
          <section
            id="deliveries-panel"
            role="tabpanel"
            aria-labelledby="deliveries-tab"
            className="min-w-0"
          >
            <DeliveryPanel />
          </section>
        )}

        {activeTab === "returns" && (
          <section
            id="returns-panel"
            role="tabpanel"
            aria-labelledby="returns-tab"
            className="min-w-0"
          >
            <ReturnsPanel />
          </section>
        )}
      </div>
    </div>
  );
}
