"use client";

import { useEffect, useState } from "react";
import OrderPanel, { Badge, money } from "./OrderPanel";
import type { Order } from "./OrderPanel";

const FILTERS = ["All", "Awaiting delivery", "Awaiting invoice", "Completed"] as const;

export default function OrderList({ limit }: { limit?: number }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null); // the order whose popup is open
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://127.0.0.1:8000/orders/");
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        setOrders(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filtering happens in the browser (no backend call)
  const text = search.toLowerCase();
  const filtered = orders.filter((o) => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Awaiting delivery" && !o.goods_received) ||
      (filter === "Awaiting invoice" && !o.invoiced) ||
      (filter === "Completed" && o.goods_received && o.invoiced);
    const matchesSearch =
      !text ||
      o.SupplierName.toLowerCase().includes(text) ||
      o.Item_Name.toLowerCase().includes(text) ||
      o.SKU.toLowerCase().includes(text);
    return matchesFilter && matchesSearch;
  });
  const shown = limit ? filtered.slice(0, limit) : filtered;

  const note = (t: string) => (
    <p style={{ padding: "2vw", textAlign: "center", color: "#888", fontSize: "0.85vw", margin: 0 }}>
      {t}
    </p>
  );

  const cell = { padding: "0.8vw 1.2vw", textAlign: "left" as const };

  return (
    <>
      <div
        style={{
          height: "100%",
          backgroundColor: "#ffffff",
          color: "#24363b",
          borderRadius: "1vw",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Filter pills + search + count (hidden when used as a small dashboard widget) */}
        {!limit && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1vw",
              padding: "1vw 1.4vw",
              borderBottom: "1px solid #eee",
            }}
          >
            <div style={{ display: "flex", gap: "0.5vw" }}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "0.4vw 1vw",
                    borderRadius: "99vw",
                    fontSize: "0.8vw",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid #c9d6d9",
                    backgroundColor: filter === f ? "#365f68" : "#ffffff",
                    color: filter === f ? "#ffffff" : "#365f68",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search supplier or item..."
                style={{
                  width: "15vw",
                  padding: "0.45vw 1vw",
                  fontSize: "0.8vw",
                  borderRadius: "99vw",
                  border: "1px solid #c9d6d9",
                  outline: "none",
                  color: "#24363b",
                  backgroundColor: "#ffffff",
                }}
              />
              <span style={{ fontSize: "0.8vw", color: "#668d98", whiteSpace: "nowrap" }}>
                {filtered.length} {filtered.length === 1 ? "order" : "orders"}
              </span>
            </div>
          </div>
        )}

        {/* The scrolling area */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            note("Loading orders...")
          ) : error ? (
            note(`Failed to load: ${error}`)
          ) : shown.length === 0 ? (
            note(orders.length === 0 ? "No orders yet. They appear when a winner is selected on a request." : "No orders match.")
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85vw" }}>
              <thead>
                <tr>
                  {["PO", "Supplier", "Item", "Qty", "Unit price", "Total", "Ordered", "Delivery", "Invoice"].map((h) => (
                    <th
                      key={h}
                      style={{
                        ...cell,
                        position: "sticky",
                        top: 0,
                        backgroundColor: "#ffffff",
                        color: "#668d98",
                        fontWeight: 600,
                        borderBottom: "1px solid #e5e5e5",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((o) => (
                  <tr
                    key={o.PO_ID}
                    onClick={() => setSelected(o)}
                    onMouseEnter={() => setHoveredId(o.PO_ID)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      backgroundColor: hoveredId === o.PO_ID ? "#f4f8f9" : "transparent",
                    }}
                  >
                    <td style={{ ...cell, color: "#888" }}>#{o.PO_ID}</td>
                    <td style={{ ...cell, fontWeight: 500 }}>{o.SupplierName}</td>
                    <td style={cell}>
                      <div style={{ fontWeight: 500 }}>{o.Item_Name}</div>
                      <div style={{ fontSize: "0.7vw", color: "#999" }}>{o.SKU}</div>
                    </td>
                    <td style={cell}>{o.Quantity}</td>
                    <td style={cell}>{money(o.unit_price)}</td>
                    <td style={{ ...cell, fontWeight: 500 }}>{money(o.Total_Amount)}</td>
                    <td style={{ ...cell, color: "#888" }}>{new Date(o.OrderDate).toLocaleDateString()}</td>
                    <td style={cell}>
                      <Badge done={o.goods_received} doneText="Received" pendingText="Awaiting" />
                    </td>
                    <td style={cell}>
                      <Badge done={o.invoiced} doneText="Invoiced" pendingText="Awaiting" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* The read-only popup, only while an order is selected */}
      {selected && <OrderPanel order={selected} onClose={() => setSelected(null)} />}
    </>
  );
}