
export interface Collection {
  payment_id: number;
  AR_ID: number;
  payment_date: string;
  payment_method: string | null;
  amount_paid: string | number;
}

export interface CollectionCreate {
  AR_ID: number;
  payment_date: string;
  payment_method: string | null;
  amount_paid: number;
}
