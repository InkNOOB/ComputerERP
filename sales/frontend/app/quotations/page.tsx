
import FeaturePage from "@/components/FeaturePage";

export default function QuotationsPage() {
  return (
    <FeaturePage
      title="Sales Quotation"
      description="Prepare and manage price quotations for customers."
      columns={["Quotation No.", "Customer", "Date", "Total Amount", "Status"]}
    />
  );
}
