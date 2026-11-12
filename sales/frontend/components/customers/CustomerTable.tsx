
"use client";

import { useState } from "react";
import type { Customer } from "../../types/customer";

type CustomerTableProps = {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onToggleStatus: (customer: Customer) => void;
};

const PAGE_SIZE = 10;

// Safely extracts contact numbers from strings, arrays, or objects.
function extractContactNumbers(value: unknown): string[] {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (typeof value === "string" || typeof value === "number") {
    return [String(value).trim()].filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap(extractContactNumbers);
  }

  if (typeof value === "object") {
    const contactObject = value as Record<string, unknown>;

    const preferredKeys = [
      "contact",
      "contact_number",
      "phone",
      "phone_number",
      "mobile",
      "landline",
      "number",
      "value",
    ];

    for (const key of preferredKeys) {
      if (contactObject[key] !== undefined) {
        return extractContactNumbers(contactObject[key]);
      }
    }

    return Object.values(contactObject).flatMap((item) =>
      typeof item === "string" || typeof item === "number"
        ? extractContactNumbers(item)
        : []
    );
  }

  return [];
}

function getContactType(contact: string): string {
  const digits = contact.replace(/\D/g, "");

  // Philippine mobile number formats: 09XXXXXXXXX or 639XXXXXXXXX.
  if (/^09\d{9}$/.test(digits) || /^639\d{9}$/.test(digits)) {
    return "Mobile Phone";
  }

  // Philippine landline numbers commonly use area codes,
  // including 02 for Metro Manila.
  if (
    /^02\d{7,8}$/.test(digits) ||
    /^0[3-9]\d{6,8}$/.test(digits) ||
    /^632\d{7,8}$/.test(digits)
  ) {
    return "Landline";
  }

  return "Contact Number";
}

export default function CustomerTable({
  customers,
  loading,
  onEdit,
  onToggleStatus,
}: CustomerTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(customers.length / PAGE_SIZE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedCustomers = customers.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        Loading customers...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="font-medium text-slate-700">
          No customers found.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Add a customer or change your search.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            
            <tr>
              <th className="px-5 py-4 text-center font-semibold">
                Customer ID
              </th>
              <th className="px-5 py-4 font-semibold">
                Customer Name
              </th>
              <th className="px-5 py-4 text-center font-semibold">
                Email
              </th>
              <th className="px-5 py-4 text-center font-semibold">
                Contact
              </th>
              <th className="px-5 py-4 font-semibold text-center">
                Type
              </th>
              <th className="px-5 py-4 font-semibold">
                Status
              </th>
              <th className="px-5 py-4 font-semibold">
                Address
              </th>
              <th className="px-5 py-4 text-center font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedCustomers.map((customer) => {
              const contactNumbers = extractContactNumbers(
                customer.contact
              );

              return (
                <tr
                  key={customer.customer_id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4 text-center font-semibold text-slate-700">
                    #{customer.customer_id}
                  </td>

                  <td className="px-5 py-4 text-center font-medium text-slate-900">
                    {customer.name}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {customer.email || "—"}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {contactNumbers.length > 0 ? (
                      <div className="space-y-1">
                        {contactNumbers.map((contact, index) => (
                          <div key={`${contact}-${index}`}>
                            <p className="font-medium text-center text-slate-800">
                              {contact}
                            </p>
                            <span className="text-xs text-slate-500">
                              {getContactType(contact)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {customer.customer_type}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        customer.status
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {customer.status ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {customer.address || "—"}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(customer)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(customer)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          customer.status
                            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {customer.status ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {startIndex + 1}
          </span>
          {" "}to{" "}
          <span className="font-semibold text-slate-700">
            {Math.min(startIndex + PAGE_SIZE, customers.length)}
          </span>
          {" "}of{" "}
          <span className="font-semibold text-slate-700">
            {customers.length}
          </span>
          {" "}customers
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setCurrentPage(safePage - 1)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="px-2 text-sm font-medium text-slate-600">
            Page {safePage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage(safePage + 1)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
