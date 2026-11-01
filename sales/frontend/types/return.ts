export interface SalesReturn {
  return_id: number;
  order_id: number;
  customer_id: number;
  item_id: number;
  quantity: number;
  return_date: string;
  reason: string;
  refund_amount: number;
  status:
    | "Requested"
    | "Approved"
    | "Rejected"
    | "Completed";
}