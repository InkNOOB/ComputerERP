
"use client";

import { useCallback, useEffect, useState } from "react";
import { customerAPI } from "../../lib/api";
import type {
  Customer,
  CustomerCreate,
} from "../../types/customer";

import CustomerForm from "../../components/customers/CustomerForm";
import CustomerTable from "../../components/customers/CustomerTable";
import CustomerBalancePage from "../customer-balance/page";

type CustomerTab = "customers" | "balance";

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<CustomerTab>("customers");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);
  const [statusCustomer, setStatusCustomer] =
    useState<Customer | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await customerAPI.getAll(search);
      setCustomers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadCustomers();
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadCustomers]);

  async function handleSave(data: CustomerCreate) {
    setSaving(true);
    setError("");

    try {
      if (editingCustomer) {
        await customerAPI.update(
          editingCustomer.customer_id,
          data
        );
      } else {
        await customerAPI.create(data);
      }

      setShowForm(false);
      setEditingCustomer(null);
      await loadCustomers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save customer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmStatusChange() {
    if (!statusCustomer) return;

    const customer = statusCustomer;
    const nextStatus = !customer.status;

    setUpdatingStatus(true);
    setError("");

    try {
      await customerAPI.updateStatus(
        customer.customer_id,
        nextStatus
      );

      setStatusCustomer(null);
      await loadCustomers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update customer status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  function openAddForm() {
    setEditingCustomer(null);
    setShowForm(true);
  }

  function openEditForm(customer: Customer) {
    setEditingCustomer(customer);
    setShowForm(true);
  }

  const activeCount = customers.filter(
    (customer) => customer.status
  ).length;

  const inactiveCount = customers.length - activeCount;

  const tabClass = (tab: CustomerTab) =>
    `rounded-lg px-5 py-3 text-sm font-semibold transition ${
      activeTab === tab
        ? "bg-blue-700 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"
    }`;

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={tabClass("customers")}
          >
            Customers
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("balance")}
            className={tabClass("balance")}
          >
            Customer Balance
          </button>
        </div>

        {activeTab === "customers" && (
          <section className="space-y-6">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}


            <section className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                title="Total Customers"
                value={customers.length}
              />

              <SummaryCard
                title="Active Customers"
                value={activeCount}
                valueClass="text-green-600"
              />

              <SummaryCard
                title="Inactive Customers"
                value={inactiveCount}
                valueClass="text-slate-500"
              />
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Customer List
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Search, edit, activate, or deactivate customers.
                  </p>
                </div>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customers..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
                />

                <div className="flex justify-end">
  <button
    type="button"
    onClick={openAddForm}
    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  >
    <span className="text-lg leading-none">+</span>
    Add Customer
  </button>
</div>
              </div>

          
              <CustomerTable
                customers={customers}
                loading={loading}
                onEdit={openEditForm}
                onToggleStatus={setStatusCustomer}
              />
            </section>
          </section>
        )}

        {activeTab === "balance" && (
          <section>
            <CustomerBalancePage />
          </section>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCustomer
                  ? "Edit Customer"
                  : "Add New Customer"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the customer information below.
              </p>
            </div>

            <CustomerForm
              key={editingCustomer?.customer_id ?? "new"}
              initialData={editingCustomer}
              loading={saving}
              onSubmit={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingCustomer(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Account Status Confirmation Modal */}
      {statusCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-modal-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                statusCustomer.status
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              <span className="text-2xl font-bold">
                {statusCustomer.status ? "!" : "✓"}
              </span>
            </div>

            <h2
              id="status-modal-title"
              className="text-xl font-bold text-slate-900"
            >
              {statusCustomer.status
                ? "Deactivate Customer Account?"
                : "Activate Customer Account?"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Are you sure you want to{" "}
              {statusCustomer.status ? "deactivate" : "activate"} this
              customer account?
            </p>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Customer Information
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {statusCustomer.name}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Customer ID: #{statusCustomer.customer_id}
              </p>

              <p className="mt-2 text-sm">
                Current Status:{" "}
                <span className="font-semibold">
                  {statusCustomer.status ? "Active" : "Inactive"}
                </span>
              </p>

              <p className="mt-1 text-sm">
                New Status:{" "}
                <span
                  className={`font-semibold ${
                    statusCustomer.status
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {statusCustomer.status ? "Inactive" : "Active"}
                </span>
              </p>
            </div>

            {statusCustomer.status && (
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Deactivating this account will mark the customer as
                inactive. Existing customer records will remain in
                the system.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => setStatusCustomer(null)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleConfirmStatusChange}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  statusCustomer.status
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {updatingStatus
                  ? "Updating..."
                  : statusCustomer.status
                    ? "Confirm Deactivation"
                    : "Confirm Activation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  title,
  value,
  valueClass = "text-slate-900",
}: {
  title: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}
