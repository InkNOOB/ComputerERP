export interface SalesOrder {
  order_id: number;
  customer_id: number;
  quotation_id: number | null;
  order_date: string;
  items: QuotationItem[];
  total_amount: number;
  status:
    | "Pending"
    | "Confirmed"
    | "Processing"
    | "Completed"
    | "Cancelled";
}