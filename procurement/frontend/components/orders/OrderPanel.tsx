"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

export type Order = {
  PO_ID: number;
  OrderDate: string;
  Total_Amount: number;
  RFQ_ID: number;
  unit_price: number;
  DeliveryTerms: string | null;
  SupplierID: number;
  SupplierName: string;
  PR_ID: number;
  Quantity: number;
  Item_Name: string;
  SKU: string;
  Warehouse_Name: string;
  goods_received: boolean;
  ReceivedDate: string | null;
  ItemCondition: string | null;
  QuantityReceived: number | null;
  Remarks: string | null;
  invoiced: boolean;
  InvoiceDate: string | null;
  TaxAmount: number | null;
  TotalDue: number | null;
};

export const money = (n: number | null) =>
  n === null || n === undefined
    ? "—"
    : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const date = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

// Small green "done" / amber "waiting" pill, used in the list and in this popup
export function Badge({
  done,
  doneText,
  pendingText,
}: {
  done: boolean;
  doneText: string;
  pendingText: string;
}) {
  return (
    <span
      style={{
        padding: "0.25vw 0.8vw",
        borderRadius: "99vw",
        fontSize: "0.75vw",
        fontWeight: 600,
        whiteSpace: "nowrap",
        backgroundColor: done ? "#dff1ec" : "#f6ecd6",
        color: done ? "#2a7a66" : "#8a6d2f",
      }}
    >
      {done ? `✓ ${doneText}` : pendingText}
    </span>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: "1.4vw" }}>
      <h3 style={{ margin: "0 0 0.5vw", fontSize: "1vw", color: "#365f68" }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", padding: "0.4vw 0", borderBottom: "1px solid #f3f3f3" }}>
      <span style={{ width: "12vw", color: "#668d98", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{children}</span>
    </div>
  );
}

export default function OrderPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  // Close with the Esc key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const completed = order.goods_received && order.invoiced;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "52vw",
          maxHeight: "85vh",
          backgroundColor: "#ffffff",
          color: "#24363b",
          borderRadius: "1.8vw",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "0.85vw",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "1.4vw 1.6vw",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
              <h2 style={{ margin: 0, fontSize: "1.2vw", color: "#365f68" }}>Order #{order.PO_ID}</h2>
              <Badge done={completed} doneText="Completed" pendingText="In progress" />
            </div>
            <p style={{ margin: "0.4vw 0 0", color: "#668d98" }}>
              From purchase request #{order.PR_ID}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ border: "none", background: "none", fontSize: "1.2vw", cursor: "pointer", color: "#668d98" }}
          >
            ✕
          </button>
        </div>

        {/* Body (scrolls if it doesn't fit) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.4vw 1.6vw" }}>
          <Section title="Order">
            <Row label="Supplier">{order.SupplierName}</Row>
            <Row label="Item">
              {order.Item_Name} ({order.SKU})
            </Row>
            <Row label="Quantity">{order.Quantity}</Row>
            <Row label="Unit price">{money(order.unit_price)}</Row>
            <Row label="Total">{money(order.Total_Amount)}</Row>
            <Row label="Delivery terms">{order.DeliveryTerms ?? "—"}</Row>
            <Row label="Deliver to">{order.Warehouse_Name}</Row>
            <Row label="Ordered on">{date(order.OrderDate)}</Row>
          </Section>

          <Section title="Delivery">
            {order.goods_received ? (
              <>
                <Row label="Received on">{date(order.ReceivedDate)}</Row>
                <Row label="Condition">{order.ItemCondition ?? "—"}</Row>
                <Row label="Quantity received">
                  {order.QuantityReceived ?? "—"} of {order.Quantity}
                </Row>
                <Row label="Remarks">{order.Remarks ?? "—"}</Row>
              </>
            ) : (
              <p style={{ margin: 0, color: "#888" }}>Not received yet.</p>
            )}
          </Section>

          <Section title="Invoice">
            {order.invoiced ? (
              <>
                <Row label="Invoice date">{date(order.InvoiceDate)}</Row>
                <Row label="Tax">{money(order.TaxAmount)}</Row>
                <Row label="Total due">{money(order.TotalDue)}</Row>
              </>
            ) : (
              <p style={{ margin: 0, color: "#888" }}>No invoice yet.</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}