export interface Collection {
  payment_id: number;
  AR_ID: number;
  payment_date: string;
  payment_method: string | null;
  transaction_number: string | null;
  amount_paid: string | number;
}

export interface CollectionCreate {
  AR_ID: number;
  payment_date: string;
  payment_method: string | null;
  transaction_number: string | null;
  amount_paid: number;
}