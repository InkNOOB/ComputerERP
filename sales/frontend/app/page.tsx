
const modules = [
  { name: "Customer Management", description: "Manage customer records", icon: "♙", href: "/customers" },
  { name: "Sales Quotation", description: "Prepare customer quotations", icon: "▤", href: "/quotations" },
  { name: "Sales Order", description: "Manage confirmed orders", icon: "🛒", href: "/orders" },
  { name: "Delivery", description: "Track product deliveries", icon: "▣", href: "/deliveries" },
  { name: "Sales Invoice", description: "Manage customer invoices", icon: "▧", href: "/invoices" },
  { name: "Accounts Receivable", description: "Track unpaid invoices", icon: "₱", href: "/accounts-receivable" },
  { name: "Collection", description: "Record customer payments", icon: "⇩", href: "/collections" },
  { name: "Sales Return", description: "Process returned products", icon: "↩", href: "/returns" },
  { name: "Customer Balance", description: "View outstanding balances", icon: "◉", href: "/customer-balance" },
  { name: "Sales Reports", description: "Review sales performance", icon: "▥", href: "/reports" },
];

const stats = [
  { label: "Total Sales", value: "₱125,000.00", note: "Sample dashboard data", icon: "↗" },
  { label: "Sales Orders", value: "48", note: "Sample order count", icon: "▤" },
  { label: "Outstanding Balance", value: "₱32,500.00", note: "Sample receivables", icon: "₱" },
  { label: "Collections", value: "₱92,500.00", note: "Sample payments", icon: "✓" },
];

const transactions = [
  { id: "SO-2026-001", customer: "Juan Dela Cruz", date: "Oct 17, 2026", amount: "₱25,000.00", status: "Confirmed" },
  { id: "SO-2026-002", customer: "Maria Santos", date: "Oct 16, 2026", amount: "₱18,500.00", status: "Processing" },
  { id: "SO-2026-003", customer: "ABC Computer Shop", date: "Oct 15, 2026", amount: "₱42,000.00", status: "Pending" },
  { id: "SO-2026-004", customer: "Pedro Reyes", date: "Oct 14, 2026", amount: "₱12,000.00", status: "Completed" },
];

export default function Home() {
    return (
  <div className="min-h-screen bg-slate-50 text-slate-800">

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-sm text-slate-500">Sales Management / Overview</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Dashboard
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Welcome! Here is your sales overview.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">Sales Administrator</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                SA
              </div>
            </div>
          </header>

          <div className="space-y-8 p-5 sm:p-8">
            {/* Page Title */}
            <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sales Overview</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Monitor sales, orders, and customer payments in one place.
                </p>
              </div>
              <a
                href="/quotations"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + New Quotation
              </a>
            </section>

            {/* Summary Cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold ${
                        index === 0
                          ? "bg-blue-50 text-blue-600"
                          : index === 1
                            ? "bg-violet-50 text-violet-600"
                            : index === 2
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {stat.icon}
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">{stat.note}</p>
                </div>
              ))}
            </section>

            {/* Modules */}
            <section>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">Sales Modules</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Select a module to access its functions.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {modules.map((module) => (
                  <a
                    key={module.name}
                    href={module.href}
                    className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                        {module.icon}
                      </div>
                      <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600">
                        →
                      </span>
                    </div>
                    <h4 className="mt-4 font-semibold text-slate-900">{module.name}</h4>
                    <p className="mt-1 text-sm text-slate-500">{module.description}</p>
                  </a>
                ))}
              </div>
            </section>

            {/* Recent Transactions */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Recent Sales Orders</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    A quick view of recent customer orders.
                  </p>
                </div>
                <a
                  href="/orders"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  View all orders →
                </a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Order ID</th>
                      <th className="px-5 py-4 font-semibold">Customer</th>
                      <th className="px-5 py-4 font-semibold">Date</th>
                      <th className="px-5 py-4 font-semibold">Amount</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="transition hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-blue-700">
                          {transaction.id}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                          {transaction.customer}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {transaction.date}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                          {transaction.amount}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              transaction.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : transaction.status === "Processing"
                                  ? "bg-blue-50 text-blue-700"
                                  : transaction.status === "Confirmed"
                                    ? "bg-violet-50 text-violet-700"
                                    : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 px-5 py-3">
                <p className="text-xs text-slate-400">
                  Sample data only. Connect the FastAPI backend to display actual records.
                </p>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
              Sales Module ERP · Sales & Customer Management
            </footer>
          </div>
        </main>
      </div>
  );
}
