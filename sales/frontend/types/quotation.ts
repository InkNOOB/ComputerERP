export interface QuotationItem {
  item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SalesQuotation {
  quotation_id: number;
  customer_id: number;
  quotation_date: string;
  valid_until: string;
  items: QuotationItem[];
  total_amount: number;
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";
}