export interface Customer {
  customer_id: number;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  customer_type: "Individual" | "Business";
  status: "Active" | "Inactive";
  created_at: string;
}