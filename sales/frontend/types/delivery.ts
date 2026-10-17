export interface Delivery {
  delivery_id: number;
  order_id: number;
  warehouse_id: number;
  delivery_date: string | null;
  delivery_address: string;
  status:
    | "Pending"
    | "Preparing"
    | "Shipped"
    | "Delivered"
    | "Cancelled";
}