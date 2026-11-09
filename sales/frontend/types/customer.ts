export interface Customer {
  customer_id: number;
  name: string;
  email: string | null;
  contact: string | null;
  address: string | null;
  customer_type: "Individual" | "Business";
  status: boolean;
}

export interface CustomerCreate {
  name: string;
  email: string | null;
  contact: string | null;
  address: string | null;
  customer_type: "Individual" | "Business";
}

export type CustomerUpdate = Partial<CustomerCreate>;