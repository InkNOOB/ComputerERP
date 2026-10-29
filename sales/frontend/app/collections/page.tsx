
import FeaturePage from "@/components/FeaturePage";

export default function CollectionsPage() {
  return (
    <FeaturePage
      title="Collection"
      description="Record and monitor payments received from customers."
      columns={["Collection No.", "Customer", "Payment Date", "Amount", "Method"]}
    />
  );
}
