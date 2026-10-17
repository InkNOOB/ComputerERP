export interface Collection {
  collection_id: number;
  customer_id: number;
  invoice_id: number;
  payment_date: string;
  amount_received: number;
  payment_method: "Cash" | "Bank Transfer" | "E-Wallet" | "Other";
  reference_number: string | null;
  status: "Pending" | "Verified" | "Rejected";
}