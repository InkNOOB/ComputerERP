"use client";

export default function ProductsPage() {
  return (
    <div className="p-6 space-y-6">

      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Products
        </h1>
        <p className="text-sm text-gray-500">
          Manage and view registered production products.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">
          Product Master List
        </h2>

        <button className="bg-[#365f68] text-white px-4 py-2 rounded-lg hover:bg-[#294b53]">
          + Add Product
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3">PM ID</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Product Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Item Type</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                colSpan={10}
                className="px-4 py-8 text-center text-gray-400"
              >
                No products found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}