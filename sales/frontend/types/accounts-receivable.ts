export interface AccountsReceivable {
  ar_id: number;
  invoice_id: number;
  customer_id: number;
  amount_due: number;
  amount_paid: number;
  remaining_balance: number;
  due_date: string;
  status: "Open" | "Partially Paid" | "Paid" | "Overdue";
}