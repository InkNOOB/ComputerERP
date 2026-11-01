"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Badge, money, type Order } from "@/components/orders/OrderPanel";

const API = "http://127.0.0.1:8000";

type Summary = {
  purchase_requests: number;
  open_requests: number;
  purchase_orders: number;
  goods_received: number;
  purchase_invoices: number;
};
type Period = "week" | "month" | "year";
type Point = { label: string; full: string; total: number; orders: number };
type OrderValue = { total: number; orders: number; series: Point[] };

const PERIODS: { key: Period; text: string; sub: string }[] = [
  { key: "week", text: "Week", sub: "Last 7 days" },
  { key: "month", text: "Month", sub: "Last 30 days" },
  { key: "year", text: "Year", sub: "Last 12 months" },
];

const date = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

// Round the chart's top value up to a clean number (1, 2, 5, 10, 20, 50 ...)
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
// 1200 -> 1.2K, 3500000 -> 3.5M
const compact = (n: number) =>
  n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : `${n}`;

// White rounded box used for every section
const box: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "1vw",
  padding: "1.2vw 1.4vw",
  boxSizing: "border-box",
  color: "#24363b",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

function BoxHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8vw" }}>
      <h2 style={{ margin: 0, fontSize: "1.05vw", fontWeight: 700, color: "#365f68" }}>{title}</h2>
      {right}
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div style={{ ...box, flex: 1, gap: "0.3vw" }}>
      <span style={{ fontSize: "0.85vw", color: "#668d98", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: "2.2vw", fontWeight: 700, color: "#24363b", lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: "0.75vw", color: "#668d98", minHeight: "1vw" }}>{note ?? ""}</span>
    </div>
  );
}

// One row of a compact list. Pass header=true for the grey heading row.
function Cols({ cols, items, header }: { cols: string; items: ReactNode[]; header?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        gap: "0.8vw",
        alignItems: "center",
        padding: "0.55vw 0",
        borderBottom: "1px solid #f0f0f0",
        fontSize: header ? "0.72vw" : "0.82vw",
        fontWeight: header ? 700 : 500,
        color: header ? "#668d98" : "#24363b",
        position: header ? "sticky" : "static",
        top: 0,
        backgroundColor: "#ffffff",
      }}
    >
      {items.map((it, i) => (
        <span key={i} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {it}
        </span>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [value, setValue] = useState<OrderValue | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Load the cards and the order list once
  useEffect(() => {
    Promise.all([
      fetch(`${API}/dashboard/summary`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`${API}/orders/`).then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([s, o]) => {
        setSummary(s);
        setOrders(o);
      })
      .catch(() => setError("Could not load the dashboard. Is the backend running?"));
  }, []);

  // Reload the chart whenever the period pill changes
  useEffect(() => {
    setHover(null);
    fetch(`${API}/dashboard/order-value?period=${period}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setValue)
      .catch(() => setError("Could not load the dashboard. Is the backend running?"));
  }, [period]);

  if (error) return <div style={{ ...box, height: "100%", fontSize: "0.95vw" }}>{error}</div>;

  const recent = orders.slice(0, 5); // API already returns newest first
  const received = orders
    .filter((o) => o.goods_received)
    .sort((a, b) => new Date(b.ReceivedDate ?? 0).getTime() - new Date(a.ReceivedDate ?? 0).getTime())
    .slice(0, 5);

  // ----- chart maths -----
  const series = value?.series ?? [];
  const max = niceMax(Math.max(0, ...series.map((p) => Number(p.total))));
  const labelStep = Math.ceil(series.length / 6) || 1; // show about 6 x-labels
  const ticks = [0, max / 2, max];
  const hp = hover !== null ? series[hover] : null;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: "1.2vw" }}>
      {/* Row of 4 cards */}
      <div style={{ display: "flex", gap: "1.2vw" }}>
        <StatCard
          label="Purchase Requests"
          value={summary?.purchase_requests ?? "–"}
          note={summary ? `open : ${summary.open_requests}` : ""}
        />
        <StatCard
          label="Purchase Orders"
          value={summary?.purchase_orders ?? "–"}
          note={summary ? `awaiting delivery : ${summary.purchase_orders - summary.goods_received}` : ""}
        />
        <StatCard label="Goods Received" value={summary?.goods_received ?? "–"} />
        <StatCard
          label="Purchase Invoices"
          value={summary?.purchase_invoices ?? "–"}
          note={summary ? `not invoiced yet : ${summary.purchase_orders - summary.purchase_invoices}` : ""}
        />
      </div>

      {/* Below the cards: two stacked boxes on the left, the chart on the right */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 27vw", gap: "1.2vw" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2vw", minHeight: 0 }}>
          {/* Recent Purchase Orders */}
          <div style={{ ...box, flex: 1 }}>
            <BoxHeader
              title="Recent Purchase Orders"
              right={
                <Link href="/orders" style={{ fontSize: "0.78vw", color: "#668d98", fontWeight: 600 }}>
                  View all →
                </Link>
              }
            />
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <Cols header cols="0.7fr 1.5fr 1.6fr 1fr 1fr" items={["PO", "Supplier", "Item", "Total", "Status"]} />
              {recent.length === 0 && (
                <p style={{ color: "#668d98", fontSize: "0.85vw" }}>No purchase orders yet.</p>
              )}
              {recent.map((o) => (
                <Cols
                  key={o.PO_ID}
                  cols="0.7fr 1.5fr 1.6fr 1fr 1fr"
                  items={[
                    `#${o.PO_ID}`,
                    o.SupplierName,
                    `${o.Item_Name} × ${o.Quantity}`,
                    money(o.Total_Amount),
                    <Badge
                      key="b"
                      done={o.goods_received && o.invoiced}
                      doneText="Completed"
                      pendingText="In progress"
                    />,
                  ]}
                />
              ))}
            </div>
          </div>

          {/* Goods Received */}
          <div style={{ ...box, flex: 1 }}>
            <BoxHeader title="Goods Received" />
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <Cols header cols="0.7fr 1.5fr 1.6fr 0.8fr 1fr" items={["PO", "Supplier", "Item", "Qty", "Received"]} />
              {received.length === 0 && (
                <p style={{ color: "#668d98", fontSize: "0.85vw" }}>Nothing received yet.</p>
              )}
              {received.map((o) => (
                <Cols
                  key={o.PO_ID}
                  cols="0.7fr 1.5fr 1.6fr 0.8fr 1fr"
                  items={[
                    `#${o.PO_ID}`,
                    o.SupplierName,
                    // Remarks (e.g. "2 crushed, contacted supplier") shows on hover
                    <span key="i" title={o.Remarks ?? ""}>{o.Item_Name}</span>,
                    `${o.QuantityReceived ?? 0}/${o.Quantity}`,
                    date(o.ReceivedDate),
                  ]}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Total Order Value */}
        <div style={box}>
          <BoxHeader
            title="Total Order Value"
            right={
              <div style={{ display: "flex", gap: "0.3vw" }}>
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "0.3vw 0.8vw",
                      borderRadius: "99vw",
                      fontSize: "0.75vw",
                      fontWeight: 600,
                      backgroundColor: period === p.key ? "#365f68" : "#e4e9ec",
                      color: period === p.key ? "#ffffff" : "#55656b",
                    }}
                  >
                    {p.text}
                  </button>
                ))}
              </div>
            }
          />

          <div style={{ fontSize: "1.7vw", fontWeight: 700, color: "#24363b" }}>
            {value ? money(value.total) : "–"}
          </div>
          <div style={{ fontSize: "0.78vw", color: "#668d98", marginBottom: "1vw" }}>
            {PERIODS.find((p) => p.key === period)?.sub} · {value?.orders ?? 0} order{value?.orders === 1 ? "" : "s"}
          </div>

          {/* The chart: plain divs, no library */}
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {/* plot area (leaves room on the left for y labels and at the bottom for x labels) */}
            <div style={{ position: "absolute", left: "2.6vw", right: 0, top: "0.6vw", bottom: "1.6vw" }}>
              {/* gridlines + y labels */}
              {ticks.map((t, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: `${(t / max) * 100}%`,
                    borderTop: "1px solid #eef0f1",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      right: "100%",
                      paddingRight: "0.5vw",
                      transform: "translateY(-50%)",
                      fontSize: "0.7vw",
                      color: "#668d98",
                    }}
                  >
                    {compact(t)}
                  </span>
                </div>
              ))}

              {/* bars: every slot is one hover target, taller than the bar itself */}
              <div style={{ position: "absolute", inset: 0, display: "flex" }}>
                {series.map((p, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
                  >
                    <div
                      style={{
                        width: "min(1.25vw, 70%)",
                        height: `${(Number(p.total) / max) * 100}%`,
                        backgroundColor: hover === i ? "#365f68" : "#668d98",
                        borderRadius: "0.2vw 0.2vw 0 0", // rounded tip, square at the baseline
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* tooltip */}
              {hp && hover !== null && (
                <div
                  style={{
                    position: "absolute",
                    left: `${((hover + 0.5) / series.length) * 100}%`,
                    top: 0,
                    transform:
                      hover < series.length * 0.2
                        ? "translateX(-20%)"
                        : hover > series.length * 0.8
                        ? "translateX(-80%)"
                        : "translateX(-50%)",
                    backgroundColor: "#ffffff",
                    color: "#24363b",
                    border: "1px solid #dfe5e7",
                    boxShadow: "0 0.3vw 0.9vw rgba(0,0,0,0.12)",
                    borderRadius: "0.6vw",
                    padding: "0.5vw 0.8vw",
                    fontSize: "0.75vw",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 2,
                  }}
                >
                  <div style={{ color: "#668d98", fontWeight: 600 }}>{hp.full}</div>
                  <div style={{ fontWeight: 700 }}>{money(hp.total)}</div>
                  <div>{hp.orders} order{hp.orders === 1 ? "" : "s"}</div>
                </div>
              )}
            </div>

            {/* x labels */}
            <div style={{ position: "absolute", left: "2.6vw", right: 0, bottom: 0, display: "flex" }}>
              {series.map((p, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    justifyContent: "center",
                    fontSize: "0.68vw",
                    color: "#668d98",
                    whiteSpace: "nowrap",
                  }}
                >
                  {(series.length - 1 - i) % labelStep === 0 ? p.label : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}