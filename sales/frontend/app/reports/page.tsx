
import FeaturePage from "@/components/FeaturePage";

export default function ReportsPage() {
  return (
    <FeaturePage
      title="Sales Reports"
      description="Review sales activity, revenue, orders, and collections."
      columns={["Report", "Period", "Total Records", "Total Amount", "Action"]}
    />
  );
}
