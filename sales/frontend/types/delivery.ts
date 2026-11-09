export type DeliveryStatus =
  | "Pending"
  | "Preparing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export interface Delivery {
  delivery_id: number;
  order_id: number;
  WH_ID: number;
  delivery_date: string | null;
  delivery_address: string;
  status: DeliveryStatus;
}

export interface DeliveryCreate {
  order_id: number;
  WH_ID: number;
  delivery_date: string | null;
  delivery_address: string;
}

export interface DeliveryStatusUpdate {
  status: DeliveryStatus;
}

export interface Warehouse {
  WH_ID: number;
  Warehouse_Name: string;
  Location: string | null;
}