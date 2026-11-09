export default function OrdersPage() {
  return (
    <div className="p-6 space-y-6">

      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Production Orders
        </h1>
        <p className="text-sm text-gray-500">
          View completed production orders prepared for Finance.
        </p>
      </div>

      {/* Section Heading */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700">
          Production Order Records
        </h2>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3">Production ID</th>
              <th className="px-4 py-3">PM ID</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Product Name</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Product Cost</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-gray-400"
              >
                No production orders found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}