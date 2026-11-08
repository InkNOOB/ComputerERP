
export interface AccountsReceivable {
  AR_ID: number;
  invoice_id: number;
  customer_id: number;
  amount_due: string | number;
  amount_paid: string | number;
  balance: string | number;
  status: string | null;
}
