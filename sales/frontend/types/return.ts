export interface SalesReturn {
  return_id: number;
  Order_Detail_ID: number;
  invoice_id: number;
  return_date: string;
  quantity: number;
  reason: string | null;
  return_amount: string | number | null;
}

export interface SalesReturnCreate {
  Order_Detail_ID: number;
  invoice_id: number;
  return_date: string;
  quantity: number;
  reason: string | null;
  return_amount?: number | null;
}