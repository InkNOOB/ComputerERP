
import FeaturePage from "@/components/FeaturePage";

export default function OrdersPage() {
  return (
    <FeaturePage
      title="Sales Order"
      description="Manage confirmed orders for computer parts and computer sets."
      columns={["Order No.", "Customer", "Order Date", "Total Amount", "Status"]}
    />
  );
}
