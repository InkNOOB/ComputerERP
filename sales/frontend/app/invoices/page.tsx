
import FeaturePage from "@/components/FeaturePage";

export default function InvoicesPage() {
  return (
    <FeaturePage
      title="Sales Invoice"
      description="Manage invoices issued for customer purchases."
      columns={["Invoice No.", "Customer", "Invoice Date", "Amount", "Status"]}
    />
  );
}
