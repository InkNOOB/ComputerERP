
"use client";

import { useState } from "react";
import InvoicePanel from "../../components/billing-collections/InvoicePanel";
import AccountsReceivablePanel from "../../components/billing-collections/AccountsReceivablePanel";
import CollectionsPanel from "../../components/billing-collections/CollectionsPanel";

type BillingTab = "invoices" | "receivables" | "collections";

const tabs: { id: BillingTab; label: string }[] = [
  { id: "invoices", label: "Sales Invoice" },
  { id: "receivables", label: "Accounts Receivable" },
  { id: "collections", label: "Payment Collections" },
];

export default function BillingCollectionsPage() {
  const [activeTab, setActiveTab] = useState<BillingTab>("invoices");

  const tabClass = (tab: BillingTab) =>
    `rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
      activeTab === tab
        ? "bg-blue-700 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"
    }`;

  return (
    <div className="min-h-full bg-slate-50 p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        <div
          role="tablist"
          aria-label="Billing and collections sections"
          className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`billing-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`billing-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={tabClass(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section
          id={`billing-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`billing-tab-${activeTab}`}
          className="min-w-0"
        >
          {activeTab === "invoices" && <InvoicePanel />}

          {activeTab === "receivables" && (
            <AccountsReceivablePanel />
          )}

          {activeTab === "collections" && <CollectionsPanel />}
        </section>
      </div>
    </div>
  );
}
