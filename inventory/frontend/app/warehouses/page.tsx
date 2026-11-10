
"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboardlayout";

interface Warehouse {
  WH_ID: number;
  Warehouse_Name: string;
  Location: string | null;
}

interface WarehouseStock {
  stock_id: number;
  im_id: number;
  sku: string;
  item_name: string;
  item_type: string;
  wh_id: number;
  warehouse_name: string;
  quantity_on_hand: number;
  reorder_level: number;
  stock_status: "Low Stock" | "Normal";
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Warehouse Management views
const [activeView, setActiveView] = useState<"list" | "stock">("list");

// Warehouse Stock states
const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([]);
const [stockLoading, setStockLoading] = useState(false);
const [stockError, setStockError] = useState("");

  // Add Warehouse states
  const [showForm, setShowForm] = useState(false);
  const [warehouseName, setWarehouseName] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit Warehouse states
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] =
    useState<Warehouse | null>(null);
  const [editWarehouseName, setEditWarehouseName] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Fetch warehouse records
  async function fetchWarehouses() {
    try {
      setError("");

      const response = await fetch(`${apiUrl}/warehouses/`);

      if (!response.ok) {
        throw new Error("Failed to load warehouse records.");
      }

      const data: Warehouse[] = await response.json();
      setWarehouses(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

    // Fetch Warehouse Stock records
async function fetchWarehouseStock() {
  try {
    setStockLoading(true);
    setStockError("");

    const response = await fetch(`${apiUrl}/warehouses/stock`);

    if (!response.ok) {
      throw new Error("Failed to load warehouse stock.");
    }

    const data: WarehouseStock[] = await response.json();
    setWarehouseStock(data);
  } catch (err) {
    setStockError(
      err instanceof Error ? err.message : "Something went wrong."
    );
  } finally {
    setStockLoading(false);
  }
}


  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Add Warehouse
  async function handleAddWarehouse(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!warehouseName.trim()) {
      setError("Warehouse name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${apiUrl}/warehouses/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          warehouse_name: warehouseName.trim(),
          location: location.trim() || null,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          result.detail || "Failed to add warehouse."
        );
      }

      const newWarehouse: Warehouse = await response.json();

      setWarehouses((previous) => [...previous, newWarehouse]);
      setWarehouseName("");
      setLocation("");
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  // Open Edit Warehouse form
  function handleEditClick(warehouse: Warehouse) {
    setShowForm(false);
    setSelectedWarehouse(warehouse);
    setEditWarehouseName(warehouse.Warehouse_Name);
    setEditLocation(warehouse.Location || "");
    setShowEditForm(true);
    setError("");
  }

  // Delete Warehouse
  async function handleDeleteWarehouse(warehouse: Warehouse) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${warehouse.Warehouse_Name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${apiUrl}/warehouses/${warehouse.WH_ID}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          result.detail || "Failed to delete warehouse."
        );
      }

      setWarehouses((previous) =>
        previous.filter(
          (item) => item.WH_ID !== warehouse.WH_ID
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    }
  }

  // Cancel Edit
  function handleCancelEdit() {
    setShowEditForm(false);
    setSelectedWarehouse(null);
    setEditWarehouseName("");
    setEditLocation("");
  }

  // Close Add Warehouse form
  function handleCancelAdd() {
    setShowForm(false);
    setWarehouseName("");
    setLocation("");
    setError("");
  }
    const filteredWarehouses = warehouses.filter((warehouse) => {
  const search = searchTerm.toLowerCase().replace(/\s/g, "");

  const warehouseName = warehouse.Warehouse_Name
    .toLowerCase()
    .replace(/\s/g, "");

  const warehouseLocation = (warehouse.Location || "")
    .toLowerCase()
    .replace(/\s/g, "");

  return (
    warehouseName.includes(search) ||
    warehouseLocation.includes(search)
  );
});

  return (
    <DashboardLayout
      title="Warehouses"
      description="Manage your warehouse locations and storage areas."
    >
      <div className="rounded-2xl border border-[#DCE7EA] bg-white p-6">

      {/* Warehouse View Navigation */}
<div className="mb-5 flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => {
      setActiveView("list");
      setError("");
    }}
    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
      activeView === "list"
        ? "bg-[#35636B] text-white"
        : "border border-[#DCE7EA] bg-white text-[#587176] hover:bg-[#F2F7F8]"
    }`}
  >
    Warehouse List
  </button>

  <button
    type="button"
    onClick={() => {
      setActiveView("stock");
      fetchWarehouseStock();
      setShowForm(false);
      setShowEditForm(false);
      setError("");
    }}
    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
      activeView === "stock"
        ? "bg-[#35636B] text-white"
        : "border border-[#DCE7EA] bg-white text-[#587176] hover:bg-[#F2F7F8]"
    }`}
  >
    Warehouse Stock
  </button>
</div>

    {activeView === "list" && (
  <>
        {/* Warehouse Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1F3338]">
              Warehouse List
            </h2>
            <p className="mt-1 text-sm text-[#587176]">
              View and manage registered warehouse locations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowEditForm(false);
              setSelectedWarehouse(null);
              setShowForm(true);
              setError("");
            }}
            className="rounded-xl bg-[#35636B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#294F56]"
          >
            + Add Warehouse
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Add Warehouse Form */}
        {showForm && (
          <form
            onSubmit={handleAddWarehouse}
            className="mb-6 rounded-xl border border-[#DCE7EA] bg-[#F2F7F8] p-5"
          >
            <h3 className="mb-4 font-bold text-[#1F3338]">
              Add New Warehouse
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  placeholder="Enter warehouse name"
                  required
                  maxLength={255}
                  className="w-full rounded-lg border border-[#DCE7EA] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#35636B]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter warehouse location"
                  className="w-full rounded-lg border border-[#DCE7EA] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#35636B]"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelAdd}
                disabled={saving}
                className="rounded-lg border border-[#DCE7EA] bg-white px-4 py-2 text-sm font-medium text-[#587176] hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || !warehouseName.trim()}
                className="rounded-lg bg-[#35636B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#294F56] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Warehouse"}
              </button>
            </div>
          </form>
        )}

        {/* Edit Warehouse Form */}
        {showEditForm && selectedWarehouse && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();

              if (!selectedWarehouse || !editWarehouseName.trim()) {
                return;
              }

              try {
                setSaving(true);
                setError("");

                const response = await fetch(
                  `${apiUrl}/warehouses/${selectedWarehouse.WH_ID}`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      warehouse_name: editWarehouseName.trim(),
                      location: editLocation.trim() || null,
                    }),
                  }
                );

                if (!response.ok) {
                  const result = await response.json();
                  throw new Error(
                    result.detail || "Failed to update warehouse."
                  );
                }

                const updatedWarehouse: Warehouse =
                  await response.json();

                setWarehouses((previous) =>
                  previous.map((warehouse) =>
                    warehouse.WH_ID === updatedWarehouse.WH_ID
                      ? updatedWarehouse
                      : warehouse
                  )
                );

                handleCancelEdit();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Something went wrong."
                );
              } finally {
                setSaving(false);
              }
            }}
            className="mb-6 rounded-xl border border-[#DCE7EA] bg-[#F2F7F8] p-5"
          >
            <h3 className="mb-4 font-bold text-[#1F3338]">
              Edit Warehouse
            </h3>

            <p className="mb-4 text-xs text-[#587176]">
              Warehouse ID: {selectedWarehouse.WH_ID}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  value={editWarehouseName}
                  onChange={(e) =>
                    setEditWarehouseName(e.target.value)
                  }
                  placeholder="Enter warehouse name"
                  required
                  maxLength={255}
                  className="w-full rounded-lg border border-[#DCE7EA] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#35636B]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                  Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) =>
                    setEditLocation(e.target.value)
                  }
                  placeholder="Enter warehouse location"
                  className="w-full rounded-lg border border-[#DCE7EA] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#35636B]"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="rounded-lg border border-[#DCE7EA] bg-white px-4 py-2 text-sm font-medium text-[#587176] hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || !editWarehouseName.trim()}
                className="rounded-lg bg-[#35636B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#294F56] disabled:opacity-50"
              >
                {saving ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
            {/* Search Warehouse */}
<div className="mb-5">
  <input
    type="text"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="Search by warehouse name or location..."
    className="w-full rounded-xl border border-[#DCE7EA] bg-white px-4 py-3 text-sm text-[#1F3338] outline-none focus:border-[#35636B] sm:max-w-md"
  />
</div>
        {/* Warehouse Table */}
        {loading ? (
          <p className="text-sm text-[#587176]">
            Loading warehouses...
          </p>
        ) : filteredWarehouses.length === 0 ? (
          <p className="text-sm text-[#587176]">
            {searchTerm.trim()
  ? "No matching warehouses found."
  : "No warehouse records found."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-[#DCE7EA] text-[#587176]">
                  <th className="w-[22%] px-4 py-3">
                    Warehouse ID
                  </th>
                  <th className="w-[28%] px-4 py-3">
                    Warehouse Name
                  </th>
                  <th className="w-[25%] px-4 py-3">
                    Location
                  </th>
                  <th className="w-[25%] px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredWarehouses.map((warehouse) => (
                  <tr
                    key={warehouse.WH_ID}
                    className="border-b border-[#DCE7EA] last:border-0"
                  >
                    {/* 1. Warehouse ID */}
                    <td className="px-4 py-4 text-[#587176]">
                      {warehouse.WH_ID}
                    </td>

                    {/* 2. Warehouse Name */}
                    <td className="px-4 py-4 font-medium text-[#1F3338]">
                      {warehouse.Warehouse_Name}
                    </td>

                    {/* 3. Location */}
                    <td className="px-4 py-4 text-[#587176]">
                      {warehouse.Location || "—"}
                    </td>

                    {/* 4. Actions */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(warehouse)}
                          className="rounded-lg border border-[#DCE7EA] px-3 py-1.5 text-xs font-semibold text-[#35636B] hover:bg-[#F2F7F8]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteWarehouse(warehouse)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}
        {activeView === "stock" && (
    <div>
    {/* Warehouse Stock Header */}
    <div className="mb-5">
      <h2 className="text-lg font-bold text-[#1F3338]">
        Warehouse Stock
      </h2>
      <p className="mt-1 text-sm text-[#587176]">
        View the quantity of items stored in each warehouse.
      </p>
    </div>

    {/* Error Message */}
    {stockError && (
      <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
        {stockError}
      </div>
    )}

    {/* Loading */}
    {stockLoading ? (
      <p className="text-sm text-[#587176]">
        Loading warehouse stock...
      </p>
    ) : warehouseStock.length === 0 ? (
      <p className="rounded-xl border border-dashed border-[#DCE7EA] bg-[#F2F7F8] p-6 text-center text-sm text-[#587176]">
        No stock records found. Stock information will appear here once items are assigned to warehouses.
      </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#DCE7EA] text-[#587176]">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Item Type</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Reorder Level</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {warehouseStock.map((stock) => (
                <tr key={stock.stock_id} className="border-b border-[#DCE7EA]">
                  <td className="px-4 py-4">{stock.sku}</td>
                  <td className="px-4 py-4">{stock.item_name}</td>
                  <td className="px-4 py-4">{stock.item_type || "—"}</td>
                  <td className="px-4 py-4">{stock.warehouse_name}</td>
                  <td className="px-4 py-4">{stock.quantity_on_hand}</td>
                  <td className="px-4 py-4">{stock.reorder_level}</td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        stock.stock_status === "Low Stock"
                          ? "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                          : "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                      }
                    >
                      {stock.stock_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        </div>
  )}
      </div>
    </DashboardLayout>
  );
}
