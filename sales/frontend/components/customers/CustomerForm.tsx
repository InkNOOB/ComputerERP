
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

function getInitialContact(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).replace(/\D/g, "").slice(0, 15);
  }

  if (Array.isArray(value)) {
    const firstContact = value.find(
      (item) =>
        typeof item === "string" || typeof item === "number"
    );

    return firstContact === undefined
      ? ""
      : String(firstContact).replace(/\D/g, "").slice(0, 15);
  }

  if (value && typeof value === "object") {
    const contactObject = value as Record<string, unknown>;

    const contactValue =
      contactObject.contact ??
      contactObject.contact_number ??
      contactObject.phone ??
      contactObject.phone_number ??
      contactObject.mobile ??
      contactObject.landline ??
      contactObject.number ??
      contactObject.value;

    return getInitialContact(contactValue);
  }

  return "";
}

export default function CustomerForm({
  initialData,
  loading,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerCreate>({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    contact: getInitialContact(initialData?.contact),
    address: initialData?.address ?? "",
    customer_type: initialData?.customer_type ?? "Individual",
  });

  function handleChange(
    field: keyof CustomerCreate,
    value: string
  ) {
    const sanitizedValue =
      field === "contact"
        ? value.replace(/\D/g, "").slice(0, 15)
        : value;

    setFormData((previous) => ({
      ...previous,
      [field]: sanitizedValue,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      ...formData,
      name: formData.name.trim(),
      email: formData.email?.trim() || null,
      contact: formData.contact?.replace(/\D/g, "") || null,
      address: formData.address?.trim() || null,
    });
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-slate-700">
          Customer Name *
        </label>
        <input
          required
          maxLength={150}
          className={inputClass}
          placeholder="Enter customer name"
          value={formData.name}
          onChange={(event) =>
            handleChange("name", event.target.value)
          }
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          Customer Type *
        </label>
        <select
          required
          className={inputClass}
          value={formData.customer_type}
          onChange={(event) =>
            handleChange("customer_type", event.target.value)
          }
        >
          <option value="Individual">Individual</option>
          <option value="Business">Business</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          Email Address
        </label>
        <input
          type="email"
          maxLength={255}
          className={inputClass}
          placeholder="customer@email.com"
          value={formData.email ?? ""}
          onChange={(event) =>
            handleChange("email", event.target.value)
          }
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          Contact Number
        </label>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={15}
          className={inputClass}
          placeholder="Enter digits only"
          value={formData.contact ?? ""}
          onChange={(event) =>
            handleChange("contact", event.target.value)
          }
        />
        <p className="mt-1 text-xs text-slate-500">
          Numbers only. Mobile phone or landline type will be identified automatically.
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          Address
        </label>
        <textarea
          maxLength={255}
          rows={3}
          className={inputClass}
          placeholder="Enter complete address"
          value={formData.address ?? ""}
          onChange={(event) =>
            handleChange("address", event.target.value)
          }
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || !formData.name.trim()}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
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
