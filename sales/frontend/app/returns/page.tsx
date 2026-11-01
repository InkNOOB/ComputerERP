
import FeaturePage from "@/components/FeaturePage";

export default function ReturnsPage() {
  return (
    <FeaturePage
      title="Sales Return"
      description="Manage returned items and the reasons for customer returns."
      columns={["Return No.", "Order No.", "Returned Item", "Return Date", "Status"]}
    />
  );
}
