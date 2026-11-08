
export type QuotationStatus =
  | "Draft"
  | "Sent"
  | "Accepted"
  | "Rejected"
  | "Expired";

export interface QuotationDetail {
  quotation_detail_id: number;
  quotation_id: number;
  IM_ID: number;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
}

export interface SalesQuotation {
  quotation_id: number;
  customer_id: number;
  quotation_date: string;
  status: QuotationStatus;
  total_amount: number;
  details: QuotationDetail[];
}
