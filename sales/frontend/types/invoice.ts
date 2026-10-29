export interface SalesInvoice {
  invoice_id: number;
  order_id: number;
  customer_id: number;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: "Unpaid" | "Partially Paid" | "Paid" | "Overdue" | "Cancelled";
}