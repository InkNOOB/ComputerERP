
import FeaturePage from "@/components/FeaturePage";

export default function CustomerBalancePage() {
  return (
    <FeaturePage
      title="Customer Balance"
      description="Review customer balances based on invoices and recorded payments."
      columns={["Customer ID", "Customer", "Total Invoiced", "Total Paid", "Balance"]}
    />
  );
}
