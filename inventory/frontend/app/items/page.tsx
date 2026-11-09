
"use client";

import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../../components/dashboardlayout";

interface Item {
  IM_ID: number;
  SKU: string;
  Item_Name: string;
  Description: string | null;
  Category: string | null;
  Brand: string | null;
  ItemType: string | null;
  unit_of_measure: string | null;
  Price: number | null;
  status: string | null;
}

const initialFormData = {
  sku: "",
  item_name: "",
  description: "",
  category: "",
  brand: "",
  item_type: "",
  unit_of_measure: "",
  price: "",
  status: "Active",
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);

  // Search and Item Type Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<
    "All" | "Raw" | "Finished"
  >("All");
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");

  if (type === "Raw" || type === "Finished") {
    setSelectedType(type);
  } else {
    setSelectedType("All");
  }
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Filter items by search and selected type
  const filteredItems = items.filter((item) => {
    const matchesSearch = [
      item.SKU,
      item.Item_Name,
      item.Category,
      item.Brand,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === "All" || item.ItemType === selectedType;

    return matchesSearch && matchesType;
  });

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/item_master/`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }

        const data: Item[] = await response.json();
        setItems(data);
      } catch {
        setError("Unable to load items. Please check your backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Open Add Item form
   const handleOpenAddForm = () => {
  setEditingId(null);

  setFormData({
    ...initialFormData,
    item_type: selectedType === "All" ? "" : selectedType,
  });

  setFormError("");
  setShowForm(true);
  };

  // Edit selected item
  const handleEditClick = (item: Item) => {
    setEditingId(item.IM_ID);

    setFormData({
      sku: item.SKU,
      item_name: item.Item_Name,
      description: item.Description ?? "",
      category: item.Category ?? "",
      brand: item.Brand ?? "",
      item_type: item.ItemType ?? "",
      unit_of_measure: item.unit_of_measure ?? "",
      price: item.Price === null ? "" : String(item.Price),
      status: item.status ?? "Active",
    });

    setFormError("");
    setShowForm(true);
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
    setFormError("");
  };

  // Add or Update Item
  const handleSaveItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSaving(true);
    setFormError("");

    const isEditing = editingId !== null;

    try {
      const response = await fetch(
        isEditing
          ? `${process.env.NEXT_PUBLIC_API_URL}/item_master/${editingId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/item_master/`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            price:
              formData.price === "" ? null : Number(formData.price),
            item_type: formData.item_type || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to save item.");
      }

      if (isEditing) {
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.IM_ID === editingId ? data : item
          )
        );
      } else {
        setItems((prevItems) => [...prevItems, data]);
      }

      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
      setFormError("");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to save item."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/item_master/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete item.");
      }

      setItems((prevItems) =>
        prevItems.filter((item) => item.IM_ID !== id)
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to delete item."
      );
    }
  };

  return (
    <DashboardLayout
      title="Item Master"
      description="Manage your raw materials and finished goods."
    >
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1F3338]">
            Item List
          </h2>

          <p className="mt-1 text-sm text-[#587176]">
            View and manage your inventory items.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddForm}
          className="rounded-xl bg-[#35636B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#527982]"
        >
          + Add Item
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSaveItem}
          className="mt-6 rounded-2xl border border-[#DCE7EA] bg-white p-6"
        >
          <h3 className="mb-5 text-lg font-bold text-[#1F3338]">
            {editingId !== null ? "Edit Item" : "Add New Item"}
          </h3>

          {formError && (
            <p className="mb-4 text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* SKU */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                SKU *
              </label>
              <input
                type="text"
                placeholder="Enter SKU"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sku: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-[#DCE7EA] p-3 outline-none focus:border-[#35636B]"
                required
              />
            </div>

            {/* Item Name */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Item Name *
              </label>
              <input
                type="text"
                placeholder="Enter item name"
                value={formData.item_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    item_name: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-[#DCE7EA] p-3 outline-none focus:border-[#35636B]"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>
              <input
                type="text"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-[#DCE7EA] p-3 outline-none focus:border-[#35636B]"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Category
              </label>
              <input
                type="text"
                placeholder="Enter category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-[#DCE7EA] p-3 outline-none focus:border-[#35636B]"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Brand
              </label>
              <input
                type="text"
                placeholder="Enter brand"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    brand: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-[#DCE7EA] p-3 outline-none focus:border-[#35636B]"
              />
            </div>

            {/* Item Type */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Item Type
              </label>
              <select
                className="w-full rounded-lg border border-[#DCE7EA] bg-white p-3"
                value={formData.item_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    item_type: e.target.value,
                  })
                }
              >
                <option value="">Select item type</option>
                <option value="Raw">Raw</option>
                <option value="Finished">Finished</option>
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Unit of Measure
              </label>
              <input
                type="text"
                placeholder="e.g. pcs, box, unit"
                value={formData.unit_of_measure}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unit_of_measure: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-[#DCE7EA] p-3 outline-none focus:border-[#35636B]"
              />
            </div>

            {/* Price */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-[#DCE7EA] p-3 outline-none focus:border-[#35636B]"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Status
              </label>
              <select
                className="w-full rounded-lg border border-[#DCE7EA] bg-white p-3"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value,
                  })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Form Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-[#DCE7EA] px-5 py-2 text-sm font-semibold text-[#587176]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className={`rounded-lg bg-[#35636B] px-5 py-2 text-sm font-semibold text-white ${
                saving
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-[#527982]"
              }`}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Item"
                  : "Save Item"}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="mt-6">
        <input
          type="text"
          placeholder="Search by SKU, item name, category, or brand..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-[#DCE7EA] bg-white p-3 text-sm outline-none focus:border-[#35636B]"
        />
      </div>

      {/* Item Type Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["All", "Raw", "Finished"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              selectedType === type
                ? "bg-[#35636B] text-white"
                : "border border-[#DCE7EA] bg-white text-[#587176] hover:bg-[#F2F7F8]"
            }`}
          >
            {type === "All"
              ? "All Items"
              : type === "Raw"
                ? "Raw Materials"
                : "Finished Goods"}
          </button>
        ))}
      </div>

      {/* Item Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DCE7EA] bg-white">
        {loading ? (
          <p className="p-6 text-sm text-[#587176]">
            Loading items...
          </p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F2F7F8] text-[#1F3338]">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Item Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Item Type</th>
                <th className="p-4">Unit</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="p-6 text-center text-[#587176]"
                  >
                    No items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.IM_ID}
                    className="border-t border-[#DCE7EA]"
                  >
                    <td className="p-4">{item.IM_ID}</td>
                    <td className="p-4">{item.SKU}</td>
                    <td className="p-4">{item.Item_Name}</td>
                    <td className="p-4">{item.Category || "-"}</td>
                    <td className="p-4">{item.Brand || "-"}</td>
                    <td className="p-4">{item.ItemType || "-"}</td>
                    <td className="p-4">
                      {item.unit_of_measure || "-"}
                    </td>
                    <td className="p-4">{item.Price ?? "-"}</td>
                    <td className="p-4">{item.status || "-"}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(item)}
                          className="rounded-lg bg-[#E5F0F1] px-3 py-2 text-sm font-semibold text-[#35636B] hover:bg-[#D5E7E9]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.IM_ID)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
