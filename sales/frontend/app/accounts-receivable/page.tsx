
import FeaturePage from "@/components/FeaturePage";

export default function AccountsReceivablePage() {
  return (
    <FeaturePage
      title="Accounts Receivable"
      description="Monitor unpaid invoices and amounts owed by customers."
      columns={["Invoice No.", "Customer", "Due Date", "Outstanding Amount", "Status"]}
    />
  );
}
