export interface CustomerBalance {
  customer_id: number;
  customer_name: string;
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  last_payment_date: string | null;
}