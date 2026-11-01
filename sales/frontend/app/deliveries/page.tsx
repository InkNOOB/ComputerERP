
import FeaturePage from "@/components/FeaturePage";

export default function DeliveriesPage() {
  return (
    <FeaturePage
      title="Delivery"
      description="Track the preparation, dispatch, and delivery of sales orders."
      columns={["Delivery No.", "Order No.", "Customer", "Delivery Date", "Status"]}
    />
  );
}
