
"use client";

import { useCallback, useEffect, useState } from "react";
import { customerAPI } from "../../lib/api";
import type {
  Customer,
  CustomerCreate,
} from "../../types/customer";

import CustomerForm from "../../components/customers/CustomerForm";
import CustomerTable from "../../components/customers/CustomerTable";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] =
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

  async function handleToggleStatus(customer: Customer) {
    const nextStatus = !customer.status;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } ${customer.name}?`
    );

    if (!confirmed) return;

    setError("");

    try {
      await customerAPI.updateStatus(
        customer.customer_id,
        nextStatus
      );
      await loadCustomers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update customer status."
      );
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

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-medium text-gray-500">
            Sales Module / Customer Management
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Customer Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage customer profiles and contact information.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700"
            >
              + Add Customer
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="mt-2 text-2xl font-semibold">
              {customers.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Active Customers</p>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Inactive Customers</p>
            <p className="mt-2 text-2xl font-semibold text-gray-500">
              {inactiveCount}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">Customer List</h2>
              <p className="mt-1 text-sm text-gray-500">
                View and manage your registered customers.
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-gray-900 sm:max-w-xs"
            />
          </div>

          <CustomerTable
            customers={customers}
            loading={loading}
            onEdit={openEditForm}
            onToggleStatus={handleToggleStatus}
          />
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold">
                {editingCustomer
                  ? "Edit Customer"
                  : "Add New Customer"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter the customer's information below.
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
    </main>
  );
}
