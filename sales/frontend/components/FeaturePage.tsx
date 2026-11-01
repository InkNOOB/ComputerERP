
type FeaturePageProps = {
  title: string;
  description: string;
  columns: string[];
};

export default function FeaturePage({
  title,
  description,
  columns,
}: FeaturePageProps) {
  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-medium text-gray-500">
            Sales Module / {title}
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {title}
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            {description}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-5">
            <h2 className="font-semibold">{title} Records</h2>
            <p className="mt-1 text-sm text-gray-500">
              Records will appear here when data is available.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-5 py-4 font-medium"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-16 text-center text-gray-500"
                  >
                    No records to display yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
