
"use client";

import Select from "react-select";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboardlayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type StockAction = "stock-in" | "stock-out" | "adjustment" | "transfer";

type Item = {
  IM_ID: number;
  SKU: string;
  Item_Name: string;
  ItemType: string | null;
  status: string | null;
  unit_of_measure: string | null;
};

type Warehouse = {
  WH_ID: number;
  Warehouse_Name: string;
  Location: string;
};

export default function StockActionsPage() {
  const [activeAction, setActiveAction] =
    useState<StockAction | null>(null);
    
const [isModalOpen, setIsModalOpen] = useState(false); 

  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedItem, setSelectedItem] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");

    // Stock Out form states
    const [stockOutItem, setStockOutItem] = useState("");
    const [stockOutWarehouse, setStockOutWarehouse] = useState("");
    const [stockOutQuantity, setStockOutQuantity] = useState("");
    const [releasePurpose, setReleasePurpose] = useState("");
    const [stockOutReferenceNo, setStockOutReferenceNo] = useState("");
    const [stockOutRemarks, setStockOutRemarks] = useState("");

    // Stock Adjustment form states
    const [adjustmentItem, setAdjustmentItem] = useState("");
    const [adjustmentWarehouse, setAdjustmentWarehouse] = useState("");
    const [physicalCount, setPhysicalCount] = useState("");
    const [adjustmentReason, setAdjustmentReason] = useState("");
    const [adjustmentReferenceNo, setAdjustmentReferenceNo] = useState("");
    const [adjustmentRemarks, setAdjustmentRemarks] = useState(""); 

    // Stock Transfer form states
    const [transferItem, setTransferItem] = useState("");
    const [sourceWarehouse, setSourceWarehouse] = useState("");
    const [destinationWarehouse, setDestinationWarehouse] = useState("");
    const [transferQuantity, setTransferQuantity] = useState("");
    const [transferReferenceNo, setTransferReferenceNo] = useState("");
    const [transferRemarks, setTransferRemarks] = useState("");

  const actions = [
    { id: "stock-in", label: "Stock In", icon: "📥" },
    { id: "stock-out", label: "Stock Out", icon: "📤" },
    { id: "adjustment", label: "Adjustment", icon: "📝" },
    { id: "transfer", label: "Transfer", icon: "↔️" },
  ] as const;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [itemResponse, warehouseResponse] = await Promise.all([
          fetch(`${API_URL}/item_master/`),
          fetch(`${API_URL}/warehouses/`),
        ]);

        if (!itemResponse.ok || !warehouseResponse.ok) {
          throw new Error("Unable to load inventory data.");
        }

        const itemData: Item[] = await itemResponse.json();
        const warehouseData: Warehouse[] =
          await warehouseResponse.json();

        setItems(
          itemData.filter(
            (item) => item.status?.toLowerCase() === "active"
          )
        );

        setWarehouses(warehouseData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#1F3338]">
            Stock Actions
          </h1>
          <p className="mt-1 text-sm text-[#587176]">
            Manage inventory transactions and stock movements.
          </p>
        </div>

        {/* Action Buttons */}
        <div>
            <div className="grid grid-cols-2 gap-4">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                setActiveAction(action.id);
                setIsModalOpen(true);
                }}
                className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 font-medium transition ${
                activeAction === action.id
                    ? "border-[#24363B] bg-[#35636B] text-white"
                    : "border-[#8FAEB4] bg-white text-[#1F3338] hover:border-[#35636B] hover:bg-[#E5F0F1]"
                }`}
              >
                <span className="text-2xl">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading and Error Messages */}
        {loading && (
          <p className="text-sm text-[#587176]">
            Loading items and warehouses...
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stock In Form */}
        {!loading && !error && isModalOpen && activeAction === "stock-in" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#DCE7EA] bg-white p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#1F3338]">
                Stock In
              </h2>
              <p className="mt-1 text-sm text-[#587176]">
                Record items physically received from Procurement or Production.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Item */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                  Select Item <span className="text-red-500">*</span>
                </label>

                <Select
                    options={items}
                    getOptionLabel={(item) =>
                        `${item.SKU} - ${item.Item_Name} (${item.ItemType})`
                    }
                    getOptionValue={(item) => String(item.IM_ID)}
                    value={
                        items.find((item) => String(item.IM_ID) === selectedItem) ?? null
                    }
                    onChange={(selectedOption) =>
                        setSelectedItem(selectedOption ? String(selectedOption.IM_ID) : "")
                    }
                    isClearable
                    placeholder="Search or choose an item..."
                    noOptionsMessage={() => "No item found"}
                    styles={{
                        control: (base) => ({
                            ...base,
                            minHeight: "46px",
                            borderColor: "#8FAEB4",
                            borderRadius: "8px",
                            boxShadow: "none",
                            backgroundColor: "#FFFFFF",
                        }),
                        menu: (base) => ({
                            ...base,
                            zIndex: 20,
                            backgroundColor: "#FFFFFF",
                        }),
                        menuList: (base) => ({
                            ...base,
                            backgroundColor: "#FFFFFF",
                        }),
                        option: (base, state) => ({
                            ...base,
                            color: "#1F3338",
                            backgroundColor: state.isSelected
                            ? "#35636B"
                            : state.isFocused
                            ? "#E5F0F1"
                            : "#FFFFFF",
                            cursor: "pointer",
                        }),
                        singleValue: (base) => ({
                            ...base,
                            color: "#1F3338",
                        }),
                        input: (base) => ({
                            ...base,
                            color: "#1F3338",
                        }),
                        placeholder: (base) => ({
                            ...base,
                            color: "#6B7280",
                        }),
                        }}
                    />
              </div>

              {/* Warehouse */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                  Select Warehouse <span className="text-red-500">*</span>
                </label>

                <Select
                    options={warehouses}
                    getOptionLabel={(warehouse) =>
                        `${warehouse.Warehouse_Name} - ${warehouse.Location}`
                    }
                    getOptionValue={(warehouse) => String(warehouse.WH_ID)}
                    value={
                        warehouses.find(
                        (warehouse) => String(warehouse.WH_ID) === selectedWarehouse
                        ) ?? null
                    }
                    onChange={(selectedOption) =>
                        setSelectedWarehouse(
                        selectedOption ? String(selectedOption.WH_ID) : ""
                        )
                    }
                    isClearable
                    placeholder="Search or choose a warehouse..."
                    noOptionsMessage={() => "No warehouse found"}
                    styles={{
                        control: (base) => ({
                        ...base,
                        minHeight: "46px",
                        borderColor: "#8FAEB4",
                        borderRadius: "8px",
                        boxShadow: "none",
                        backgroundColor: "#FFFFFF",
                        }),
                        menu: (base) => ({
                        ...base,
                        zIndex: 20,
                        backgroundColor: "#FFFFFF",
                        }),
                        menuList: (base) => ({
                        ...base,
                        backgroundColor: "#FFFFFF",
                        }),
                        option: (base, state) => ({
                        ...base,
                        color: "#1F3338",
                        backgroundColor: state.isSelected
                            ? "#35636B"
                            : state.isFocused
                            ? "#E5F0F1"
                            : "#FFFFFF",
                        cursor: "pointer",
                        }),
                        singleValue: (base) => ({
                        ...base,
                        color: "#1F3338",
                        }),
                        input: (base) => ({
                        ...base,
                        color: "#1F3338",
                        }),
                        placeholder: (base) => ({
                        ...base,
                        color: "#6B7280",
                        }),
                    }}
                    />
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                  Quantity Received <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity received"
                  className="w-full rounded-lg border border-[#8FAEB4] px-3 py-3 text-sm text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                />
              </div>

              {/* Reorder Level */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                  Reorder Level
                </label>

                <input
                  type="number"
                  min="0"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  placeholder="Enter reorder level if needed"
                  className="w-full rounded-lg border border-[#8FAEB4] px-3 py-3 text-sm text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                />

                <p className="mt-1 text-xs text-[#587176]">
                  Required when creating a new stock record.
                </p>
              </div>

              {/* Reference Number */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                  Reference Number
                </label>

                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Enter PO or production reference"
                  className="w-full rounded-lg border border-[#8FAEB4] px-3 py-3 text-sm text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                  Remarks
                </label>

                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter additional notes"
                  className="w-full rounded-lg border border-[#8FAEB4] px-3 py-3 text-sm text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#DCE7EA] pt-5">
                <button
                    type="button"
                    onClick={() => {
                    setIsModalOpen(false);
                    setActiveAction(null);
                    }}
                    className="rounded-lg border border-[#8FAEB4] bg-white px-5 py-2.5 text-sm font-medium text-[#1F3338] hover:bg-[#F2F7F8]"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    disabled
                    className="rounded-lg bg-[#35636B] px-5 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
                >
                    Save Transaction
                </button>
                </div>
          </div>
          </div>
        )}
            
        {/* Stock Out Form */}
        {!loading && !error && isModalOpen && activeAction === "stock-out" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#8FAEB4] bg-white p-6 shadow-xl">

              {/* Form Header */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#1F3338]">
                  Stock Out
                </h2>
                <p className="mt-1 text-sm text-[#587176]">
                  Record items released from the warehouse for Sales, Production, or other purposes.
                </p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Item */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                    Select Item <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={items}
                    getOptionLabel={(item) =>
                        `${item.SKU} - ${item.Item_Name} (${item.ItemType})`
                    }
                    getOptionValue={(item) => String(item.IM_ID)}
                    value={
                        items.find(
                        (item) => String(item.IM_ID) === stockOutItem
                        ) ?? null
                    }
                    onChange={(selectedOption) =>
                        setStockOutItem(
                        selectedOption ? String(selectedOption.IM_ID) : ""
                        )
                    }
                    isClearable
                    placeholder="Search or choose an item..."
                    noOptionsMessage={() => "No item found"}
                    styles={{
                        control: (base) => ({
                        ...base,
                        minHeight: "46px",
                        borderColor: "#8FAEB4",
                        borderRadius: "8px",
                        boxShadow: "none",
                        backgroundColor: "#FFFFFF",
                        }),
                        menu: (base) => ({
                        ...base,
                        zIndex: 20,
                        backgroundColor: "#FFFFFF",
                        }),
                        menuList: (base) => ({
                        ...base,
                        backgroundColor: "#FFFFFF",
                        }),
                        option: (base, state) => ({
                        ...base,
                        color: "#1F3338",
                        backgroundColor: state.isSelected
                            ? "#35636B"
                            : state.isFocused
                            ? "#E5F0F1"
                            : "#FFFFFF",
                        cursor: "pointer",
                        }),
                        singleValue: (base) => ({
                        ...base,
                        color: "#1F3338",
                        }),
                        input: (base) => ({
                        ...base,
                        color: "#1F3338",
                        }),
                        placeholder: (base) => ({
                        ...base,
                        color: "#6B7280",
                        }),
                    }}
                    />
                </div>

                {/* Warehouse */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                    Select Warehouse <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={warehouses}
                    getOptionLabel={(warehouse) =>
                        `${warehouse.Warehouse_Name} - ${warehouse.Location}`
                    }
                    getOptionValue={(warehouse) => String(warehouse.WH_ID)}
                    value={
                        warehouses.find(
                        (warehouse) => String(warehouse.WH_ID) === stockOutWarehouse
                        ) ?? null
                    }
                    onChange={(selectedOption) =>
                        setStockOutWarehouse(
                        selectedOption ? String(selectedOption.WH_ID) : ""
                        )
                    }
                    isClearable
                    placeholder="Search or choose a warehouse..."
                    noOptionsMessage={() => "No warehouse found"}
                    styles={{
                        control: (base) => ({
                        ...base,
                        minHeight: "46px",
                        borderColor: "#8FAEB4",
                        borderRadius: "8px",
                        boxShadow: "none",
                        backgroundColor: "#FFFFFF",
                        }),
                        menu: (base) => ({
                        ...base,
                        zIndex: 20,
                        backgroundColor: "#FFFFFF",
                        }),
                        menuList: (base) => ({
                        ...base,
                        backgroundColor: "#FFFFFF",
                        }),
                        option: (base, state) => ({
                        ...base,
                        color: "#1F3338",
                        backgroundColor: state.isSelected
                            ? "#35636B"
                            : state.isFocused
                            ? "#E5F0F1"
                            : "#FFFFFF",
                        cursor: "pointer",
                        }),
                        singleValue: (base) => ({
                        ...base,
                        color: "#1F3338",
                        }),
                        input: (base) => ({
                        ...base,
                        color: "#1F3338",
                        }),
                        placeholder: (base) => ({
                        ...base,
                        color: "#6B7280",
                        }),
                    }}
                    />
                </div>

                {/* Quantity */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                    Quantity to Release <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockOutQuantity}
                    onChange={(e) => setStockOutQuantity(e.target.value)}
                    placeholder="Enter quantity to release"
                    className="w-full rounded-lg border border-[#8FAEB4] px-3 py-3 text-sm text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                  />
                </div>

                {/* Release Purpose */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                    Release Purpose <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={releasePurpose}
                    onChange={(e) => setReleasePurpose(e.target.value)}
                    className="w-full rounded-lg border border-[#8FAEB4] bg-white px-3 py-3 text-sm text-[#1F3338] outline-none focus:border-[#35636B]"
                  >
                    <option value="">Select purpose</option>
                    <option value="Sales">Sales</option>
                    <option value="Production">Production</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Reference Number */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={stockOutReferenceNo}
                    onChange={(e) => setStockOutReferenceNo(e.target.value)}
                    placeholder="Enter sales or production reference"
                    className="w-full rounded-lg border border-[#8FAEB4] px-3 py-3 text-sm text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={stockOutRemarks}
                    onChange={(e) => setStockOutRemarks(e.target.value)}
                    placeholder="Enter additional notes"
                    className="w-full rounded-lg border border-[#8FAEB4] px-3 py-3 text-sm text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                  />
                </div>

              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-end gap-3 border-t border-[#8FAEB4] pt-5">
                <button
                  type="button"
                  onClick={() => {
                  setIsModalOpen(false);
                  setActiveAction(null);
                }}
                  className="rounded-lg border border-[#8FAEB4] bg-white px-5 py-2.5 text-sm font-medium text-[#1F3338] hover:bg-[#F2F7F8]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-lg bg-[#35636B] px-5 py-2.5 text-sm font-medium text-white opacity-50"
                >
                  Save Transaction
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Stock Adjustment Form */}
        {!loading && !error && isModalOpen && activeAction === "adjustment" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#8FAEB4] bg-white p-6 shadow-xl">

            {/* Form Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#1F3338]">
                Stock Adjustment
                </h2>
                <p className="mt-1 text-sm text-[#587176]">
                Update inventory records based on the actual physical stock count.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Item */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                    Select Item *
                    </label>

                    <Select
                    options={items}
                    getOptionLabel={(item) =>
                        `${item.SKU} - ${item.Item_Name} (${item.ItemType})`
                    }
                    getOptionValue={(item) => String(item.IM_ID)}
                    value={
                        items.find(
                        (item) => String(item.IM_ID) === adjustmentItem
                        ) ?? null
                    }
                    onChange={(selectedOption) =>
                        setAdjustmentItem(
                        selectedOption ? String(selectedOption.IM_ID) : ""
                        )
                    }
                    isClearable
                    placeholder="Search or choose an item..."
                    noOptionsMessage={() => "No item found"}
                    styles={{
                        control: (base) => ({
                        ...base,
                        minHeight: "46px",
                        borderColor: "#8FAEB4",
                        borderRadius: "8px",
                        boxShadow: "none",
                        backgroundColor: "#FFFFFF",
                        }),
                        menu: (base) => ({
                        ...base,
                        zIndex: 20,
                        backgroundColor: "#FFFFFF",
                        }),
                        menuList: (base) => ({
                        ...base,
                        backgroundColor: "#FFFFFF",
                        }),
                        option: (base, state) => ({
                        ...base,
                        color: "#1F3338",
                        backgroundColor: state.isSelected
                            ? "#35636B"
                            : state.isFocused
                            ? "#E5F0F1"
                            : "#FFFFFF",
                        cursor: "pointer",
                        }),
                        singleValue: (base) => ({
                        ...base,
                        color: "#1F3338",
                        }),
                        input: (base) => ({
                        ...base,
                        color: "#1F3338",
                        }),
                        placeholder: (base) => ({
                        ...base,
                        color: "#6B7280",
                        }),
                    }}
                    />
                </div>

                {/* Warehouse */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                        Select Warehouse *
                    </label>

                    <Select
                        options={warehouses}
                        getOptionLabel={(warehouse) =>
                        `${warehouse.Warehouse_Name} - ${warehouse.Location}`
                        }
                        getOptionValue={(warehouse) => String(warehouse.WH_ID)}
                        value={
                        warehouses.find(
                            (warehouse) =>
                            String(warehouse.WH_ID) === adjustmentWarehouse
                        ) ?? null
                        }
                        onChange={(selectedOption) =>
                        setAdjustmentWarehouse(
                            selectedOption ? String(selectedOption.WH_ID) : ""
                        )
                        }
                        isClearable
                        placeholder="Search or choose a warehouse..."
                        noOptionsMessage={() => "No warehouse found"}
                        styles={{
                        control: (base) => ({
                            ...base,
                            minHeight: "46px",
                            borderColor: "#8FAEB4",
                            borderRadius: "8px",
                            boxShadow: "none",
                            backgroundColor: "#FFFFFF",
                        }),
                        menu: (base) => ({
                            ...base,
                            zIndex: 20,
                            backgroundColor: "#FFFFFF",
                        }),
                        menuList: (base) => ({
                            ...base,
                            backgroundColor: "#FFFFFF",
                        }),
                        option: (base, state) => ({
                            ...base,
                            color: "#1F3338",
                            backgroundColor: state.isSelected
                            ? "#35636B"
                            : state.isFocused
                            ? "#E5F0F1"
                            : "#FFFFFF",
                            cursor: "pointer",
                        }),
                        singleValue: (base) => ({
                            ...base,
                            color: "#1F3338",
                        }),
                        input: (base) => ({
                            ...base,
                            color: "#1F3338",
                        }),
                        placeholder: (base) => ({
                            ...base,
                            color: "#6B7280",
                        }),
                        }}
                    />
                </div>

                {/* Physical Count */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                        Actual Physical Count *
                    </label>

                    <input
                        type="number"
                        min="0"
                        value={physicalCount}
                        onChange={(e) => setPhysicalCount(e.target.value)}
                        placeholder="Enter actual quantity counted"
                        className="w-full rounded-lg border border-[#8FAEB4] bg-white px-4 py-3 text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                    />
                </div>

                {/* Adjustment Reason */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                        Adjustment Reason *
                    </label>

                    <select
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        className="w-full rounded-lg border border-[#8FAEB4] bg-white px-4 py-3 text-[#1F3338] outline-none focus:border-[#35636B]"
                    >
                        <option value="">Select reason</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Lost">Lost</option>
                        <option value="Found">Found</option>
                        <option value="Counting Error">Counting Error</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                {/* Remarks */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                        Remarks
                    </label>

                    <input
                        type="text"
                        value={adjustmentRemarks}
                        onChange={(e) => setAdjustmentRemarks(e.target.value)}
                        placeholder="Enter additional notes"
                        className="w-full rounded-lg border border-[#8FAEB4] bg-white px-4 py-3 text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                    />
                </div>
            </div>
                    {/* Form Buttons */}
                <div className="mt-6 flex justify-end gap-3 border-t border-[#8FAEB4] pt-5">

                    <button
                        type="button"
                        onClick={() => {
                        setIsModalOpen(false);
                        setActiveAction(null);
                        }}
                        className="rounded-lg border border-[#8FAEB4] px-5 py-2.5 font-medium text-[#1F3338] transition hover:bg-[#E5F0F1]"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-lg bg-[#35636B] px-5 py-2.5 font-medium text-white opacity-50"
                    >
                        Save Transaction
                    </button>
                </div>

            </div>
        </div>
        )}

        {/* Stock Transfer Form */}
        {!loading && !error && isModalOpen && activeAction === "transfer" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#8FAEB4] bg-white p-6 shadow-xl">

            {/* Form Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#1F3338]">
                Stock Transfer
                </h2>
                <p className="mt-1 text-sm text-[#587176]">
                Transfer items from one warehouse to another.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* Item */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                    Select Item *
                    </label>

                    <Select
                    options={items}
                    getOptionLabel={(item) =>
                        `${item.SKU} - ${item.Item_Name} (${item.ItemType})`
                    }
                    getOptionValue={(item) => String(item.IM_ID)}
                    value={
                        items.find(
                        (item) => String(item.IM_ID) === transferItem
                        ) ?? null
                    }
                    onChange={(selectedOption) =>
                        setTransferItem(
                        selectedOption ? String(selectedOption.IM_ID) : ""
                        )
                    }
                    isClearable
                    placeholder="Search or choose an item..."
                    noOptionsMessage={() => "No item found"}
                    styles={{
                        control: (base) => ({
                        ...base,
                        minHeight: "46px",
                        borderColor: "#8FAEB4",
                        borderRadius: "8px",
                        boxShadow: "none",
                        backgroundColor: "#FFFFFF",
                        }),
                        menu: (base) => ({
                        ...base,
                        zIndex: 20,
                        backgroundColor: "#FFFFFF",
                        }),
                        menuList: (base) => ({
                        ...base,
                        backgroundColor: "#FFFFFF",
                        }),
                        option: (base, state) => ({
                        ...base,
                        color: "#1F3338",
                        backgroundColor: state.isSelected
                            ? "#35636B"
                            : state.isFocused
                            ? "#E5F0F1"
                            : "#FFFFFF",
                        cursor: "pointer",
                        }),
                        singleValue: (base) => ({
                        ...base,
                        color: "#1F3338",
                        }),
                        input: (base) => ({
                        ...base,
                        color: "#1F3338",
                        }),
                        placeholder: (base) => ({
                        ...base,
                        color: "#6B7280",
                        }),
                    }}
                    />
                </div>

                {/* Source Warehouse */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                        Source Warehouse *
                    </label>

                    <Select
                        options={warehouses}
                        getOptionLabel={(warehouse) =>
                        `${warehouse.Warehouse_Name} - ${warehouse.Location}`
                        }
                        getOptionValue={(warehouse) => String(warehouse.WH_ID)}
                        value={
                        warehouses.find(
                            (warehouse) => String(warehouse.WH_ID) === sourceWarehouse
                        ) ?? null
                        }
                        onChange={(selectedOption) =>
                        setSourceWarehouse(
                            selectedOption ? String(selectedOption.WH_ID) : ""
                        )
                        }
                        isClearable
                        placeholder="Search source warehouse..."
                        noOptionsMessage={() => "No warehouse found"}
                        styles={{
                        control: (base) => ({
                            ...base,
                            minHeight: "46px",
                            borderColor: "#8FAEB4",
                            borderRadius: "8px",
                            boxShadow: "none",
                            backgroundColor: "#FFFFFF",
                        }),
                        menu: (base) => ({
                            ...base,
                            zIndex: 20,
                            backgroundColor: "#FFFFFF",
                        }),
                        menuList: (base) => ({
                            ...base,
                            backgroundColor: "#FFFFFF",
                        }),
                        option: (base, state) => ({
                            ...base,
                            color: "#1F3338",
                            backgroundColor: state.isSelected
                            ? "#35636B"
                            : state.isFocused
                            ? "#E5F0F1"
                            : "#FFFFFF",
                            cursor: "pointer",
                        }),
                        singleValue: (base) => ({
                            ...base,
                            color: "#1F3338",
                        }),
                        input: (base) => ({
                            ...base,
                            color: "#1F3338",
                        }),
                        placeholder: (base) => ({
                            ...base,
                            color: "#6B7280",
                        }),
                        }}
                    />
                </div>

                {/* Destination Warehouse */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                            Destination Warehouse *
                        </label>

                        <Select
                            options={warehouses}
                            getOptionLabel={(warehouse) =>
                            `${warehouse.Warehouse_Name} - ${warehouse.Location}`
                            }
                            getOptionValue={(warehouse) => String(warehouse.WH_ID)}
                            value={
                            warehouses.find(
                                (warehouse) =>
                                String(warehouse.WH_ID) === destinationWarehouse
                            ) ?? null
                            }
                            onChange={(selectedOption) =>
                            setDestinationWarehouse(
                                selectedOption ? String(selectedOption.WH_ID) : ""
                            )
                            }
                            isClearable
                            placeholder="Search destination warehouse..."
                            noOptionsMessage={() => "No warehouse found"}
                            styles={{
                            control: (base) => ({
                                ...base,
                                minHeight: "46px",
                                borderColor: "#8FAEB4",
                                borderRadius: "8px",
                                boxShadow: "none",
                                backgroundColor: "#FFFFFF",
                            }),
                            menu: (base) => ({
                                ...base,
                                zIndex: 20,
                                backgroundColor: "#FFFFFF",
                            }),
                            menuList: (base) => ({
                                ...base,
                                backgroundColor: "#FFFFFF",
                            }),
                            option: (base, state) => ({
                                ...base,
                                color: "#1F3338",
                                backgroundColor: state.isSelected
                                ? "#35636B"
                                : state.isFocused
                                ? "#E5F0F1"
                                : "#FFFFFF",
                                cursor: "pointer",
                            }),
                            singleValue: (base) => ({
                                ...base,
                                color: "#1F3338",
                            }),
                            input: (base) => ({
                                ...base,
                                color: "#1F3338",
                            }),
                            placeholder: (base) => ({
                                ...base,
                                color: "#6B7280",
                            }),
                            }}
                        />
                    </div>

                    {/* Transfer Quantity */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                            Quantity to Transfer *
                        </label>

                        <input
                            type="number"
                            min="1"
                            value={transferQuantity}
                            onChange={(e) => setTransferQuantity(e.target.value)}
                            placeholder="Enter quantity to transfer"
                            className="w-full rounded-lg border border-[#8FAEB4] bg-white px-4 py-3 text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                        />
                    </div>

                    {/* Reference Number */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                            Reference Number
                        </label>

                        <input
                            type="text"
                            value={transferReferenceNo}
                            onChange={(e) => setTransferReferenceNo(e.target.value)}
                            placeholder="Enter reference number"
                            className="w-full rounded-lg border border-[#8FAEB4] bg-white px-4 py-3 text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                        />
                    </div>

                    {/* Remarks */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#1F3338]">
                            Remarks
                        </label>

                        <input
                            type="text"
                            value={transferRemarks}
                            onChange={(e) => setTransferRemarks(e.target.value)}
                            placeholder="Enter additional notes"
                            className="w-full rounded-lg border border-[#8FAEB4] bg-white px-4 py-3 text-[#1F3338] placeholder:text-[#6B7280] outline-none focus:border-[#35636B]"
                        />
                    </div>

            </div>

            {/* Form Buttons */}
            <div className="mt-6 flex justify-end gap-3 border-t border-[#8FAEB4] pt-5">

            <button
                type="button"
                onClick={() => {
                setIsModalOpen(false);
                setActiveAction(null);
                }}
                className="rounded-lg border border-[#8FAEB4] px-5 py-2.5 font-medium text-[#1F3338] transition hover:bg-[#E5F0F1]"
            >
                Cancel
            </button>

            <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg bg-[#35636B] px-5 py-2.5 font-medium text-white opacity-50"
            >
                Save Transaction
            </button>

            </div>

            </div>
        </div>
        )}

      </div>
    </DashboardLayout>
  );
}
