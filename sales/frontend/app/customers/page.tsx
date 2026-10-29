
import FeaturePage from "@/components/FeaturePage";

export default function CustomersPage() {
  return (
    <FeaturePage
      title="Customer Management"
      description="Manage customer profiles and contact information."
      columns={["Customer ID", "Customer Name", "Email", "Phone", "Status"]}
    />
  );
}