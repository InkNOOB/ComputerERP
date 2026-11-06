const modules = [
  { name: "Customer Management", description: "Manage customer records", href: "/customers" },
  { name: "Sales Quotation", description: "Prepare customer quotations", href: "/quotations" },
  { name: "Sales Order", description: "Manage confirmed orders", href: "/orders" },
  { name: "Delivery", description: "Track product deliveries", href: "/deliveries" },
  { name: "Sales Invoice", description: "Manage customer invoices", href: "/invoices" },
  { name: "Accounts Receivable", description: "Track unpaid invoices", href: "/accounts-receivable" },
  { name: "Collection", description: "Record customer payments", href: "/collections" },
  { name: "Sales Return", description: "Process returned products", href: "/returns" },
  { name: "Customer Balance", description: "View outstanding balances", href: "/customer-balance" },
  { name: "Sales Reports", description: "Review sales performance", href: "/reports" },
];

const stats = [
  "Total Sales",
  "Sales Orders",
  "Outstanding Balance",
  "Collections",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-5 py-6 sm:px-8">
          <p className="text-sm font-semibold text-blue-700">
            Sales Management / Overview
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            Monitor sales, orders, and customer payments in one place.
          </p>
        </header>

        <div className="space-y-10 p-5 sm:p-8">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Sales Overview</h2>
              <p className="mt-2 text-slate-600">
                Key sales figures will appear here.
              </p>
            </div>

            <a
              href="/quotations"
              className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800"
            >
              New Quotation
            </a>
          </section>

          <section
            aria-label="Sales summary"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
          >
            {stats.map((label) => (
              <div
                key={label}
                className="flex min-h-48 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <h3 className="text-base font-bold text-slate-700">{label}</h3>
                <div>
                  <p className="text-4xl font-extrabold tracking-tight text-slate-950">
                    —
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    No data available.
                  </p>
                </div>
              </div>
            ))}
          </section>

          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-950">Sales Modules</h2>
              <p className="mt-2 text-slate-600">
                Select a module to access its functions.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <a
                  key={module.name}
                  href={module.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
                >
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-800">
                    {module.name}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {module.description}
                  </p>
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">Recent Sales Orders</h2>
            <p className="mt-2 text-slate-600">
              No recent sales orders to display.
            </p>
          </section>

          <footer className="border-t border-slate-200 pt-5 text-center text-sm font-medium text-slate-500">
            Sales Module ERP · Sales &amp; Customer Management
          </footer>
        </div>
      </main>
    </div>
  );
}