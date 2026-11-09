
"use client";

import type { Customer } from "../../types/customer";

type CustomerTableProps = {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onToggleStatus: (customer: Customer) => void;
};

export default function CustomerTable({
  customers,
  loading,
  onEdit,
  onToggleStatus,
}: CustomerTableProps) {
  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-gray-500">
        Loading customers...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="font-medium text-gray-700">
          No customers found.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Add a customer or change your search.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-5 py-4 font-medium">Customer ID</th>
            <th className="px-5 py-4 font-medium">Customer Name</th>
            <th className="px-5 py-4 font-medium">Email</th>
            <th className="px-5 py-4 font-medium">Contact</th>
            <th className="px-5 py-4 font-medium">Type</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium">Address</th>
            <th className="px-5 py-4 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {customers.map((customer) => (
            <tr
              key={customer.customer_id}
              className="hover:bg-gray-50"
            >
              <td className="px-5 py-4">
                #{customer.customer_id}
              </td>

              <td className="px-5 py-4 font-medium text-gray-900">
                {customer.name}
              </td>

              <td className="px-5 py-4 text-gray-600">
                {customer.email || "—"}
              </td>

              <td className="px-5 py-4 text-gray-600">
                {customer.contact || "—"}
              </td>

              <td className="px-5 py-4">
                {customer.customer_type}
              </td>

              <td className="px-5 py-4 text-gray-600">
                {customer.address || "—"}
              </td>

              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    customer.status
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {customer.status ? "Active" : "Inactive"}
                </span>
              </td>

              <td className="px-5 py-4">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(customer)}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(customer)}
                    className={`font-medium ${
                      customer.status
                        ? "text-red-600 hover:text-red-800"
                        : "text-green-600 hover:text-green-800"
                    }`}
                  >
                    {customer.status ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
