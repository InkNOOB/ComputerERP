export interface SalesInvoice {
  invoice_id: number;
  order_id: number;
  invoice_date: string;
  due_date: string | null;
  total_due: string | number;
}

export interface SalesInvoiceCreate {
  order_id: number;
  invoice_date: string;
  due_date: string | null;
}