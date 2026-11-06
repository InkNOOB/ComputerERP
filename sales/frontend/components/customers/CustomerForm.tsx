
"use client";

import { useState, type FormEvent } from "react";
import type {
  Customer,
  CustomerCreate,
} from "../../types/customer";

type CustomerFormProps = {
  initialData?: Customer | null;
  loading: boolean;
  onSubmit: (data: CustomerCreate) => Promise<void>;
  onCancel: () => void;
};

export default function CustomerForm({
  initialData,
  loading,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerCreate>({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    contact: initialData?.contact ?? "",
    address: initialData?.address ?? "",
    customer_type: initialData?.customer_type ?? "Individual",
  });

  function handleChange(
    field: keyof CustomerCreate,
    value: string
  ) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      ...formData,
      name: formData.name.trim(),
      email: formData.email?.trim() || null,
      contact: formData.contact?.trim() || null,
      address: formData.address?.trim() || null,
    });
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">
          Customer Name *
        </label>
        <input
          required
          maxLength={150}
          className={inputClass}
          placeholder="Enter customer name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Customer Type *
        </label>
        <select
          className={inputClass}
          value={formData.customer_type}
          onChange={(e) =>
            handleChange("customer_type", e.target.value)
          }
        >
          <option value="Individual">Individual</option>
          <option value="Business">Business</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          maxLength={255}
          className={inputClass}
          placeholder="customer@email.com"
          value={formData.email ?? ""}
          onChange={(e) => handleChange("email", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Contact Number
        </label>
        <input
          type="tel"
          maxLength={30}
          className={inputClass}
          placeholder="Enter contact number"
          value={formData.contact ?? ""}
          onChange={(e) => handleChange("contact", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Address
        </label>
        <textarea
          maxLength={255}
          rows={3}
          className={inputClass}
          placeholder="Enter complete address"
          value={formData.address ?? ""}
          onChange={(e) => handleChange("address", e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || !formData.name.trim()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : initialData
              ? "Update Customer"
              : "Save Customer"}
        </button>
      </div>
    </form>
  );
}
