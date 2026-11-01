"use client";

import { useEffect, useState } from "react";
import QuotationPanel from "./QuotationPanel";

type PurchaseRequest = {
  PR_ID: number;
  Status: "Open" | "Closed" | "Cancelled";
  DateIssued: string;
  RestockRequestID: number;
  Item_Name: string;
  SKU: string;
  Quantity: number;
  Warehouse_Name: string;
  bid_count: number;
};

const FILTERS = ["All", "Open", "Closed", "Cancelled"] as const;

const STATUS_COLORS = {
  Open: { bg: "#dff1ec", text: "#2a7a66" },
  Closed: { bg: "#e4e9ec", text: "#55656b" },
  Cancelled: { bg: "#f6e1e1", text: "#a14646" },
};

export default function RequestList({ limit }: { limit?: number }) {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [selectedId, setSelectedId] = useState<number | null>(null); // which request's popup is open
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0); // bump this to re-fetch the list

  // Fetch again whenever the filter changes or the popup reports a change
  useEffect(() => {
    async function load() {
      try {
        const query = filter === "All" ? "" : `?status=${filter}`;
        const res = await fetch(`http://127.0.0.1:8000/purchase-requests/${query}`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        setRequests(await res.json());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter, reloadKey]);

  const shown = limit ? requests.slice(0, limit) : requests;

  const note = (text: string) => (
    <p style={{ padding: "2vw", textAlign: "center", color: "#888", fontSize: "0.85vw", margin: 0 }}>
      {text}
    </p>
  );

  const cell = { padding: "0.8vw 1.4vw", textAlign: "left" as const };

  return (
    <>
      <div
        style={{
          height: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "1vw",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Filter pills + count (hidden when used as a small dashboard widget) */}
        {!limit && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
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
            <span style={{ fontSize: "0.8vw", color: "#668d98" }}>
              {requests.length} {requests.length === 1 ? "request" : "requests"}
            </span>
          </div>
        )}

        {/* The scrolling area */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            note("Loading requests...")
          ) : error ? (
            note(`Failed to load: ${error}`)
          ) : shown.length === 0 ? (
            note(filter === "All" ? "No purchase requests yet." : `No ${filter.toLowerCase()} requests.`)
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85vw" }}>
              <thead>
                <tr>
                  {["ID", "Item", "Qty", "Warehouse", "Bids", "Status", "Issued"].map((h) => (
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
                {shown.map((r) => {
                  const c = STATUS_COLORS[r.Status];
                  return (
                    <tr
                      key={r.PR_ID}
                      onClick={() => setSelectedId(r.PR_ID)}
                      onMouseEnter={() => setHoveredId(r.PR_ID)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        cursor: "pointer",
                        borderBottom: "1px solid #f0f0f0",
                        backgroundColor: hoveredId === r.PR_ID ? "#f4f8f9" : "transparent",
                      }}
                    >
                      <td style={{ ...cell, color: "#888" }}>#{r.PR_ID}</td>
                      <td style={cell}>
                        <div style={{ fontWeight: 500 }}>{r.Item_Name}</div>
                        <div style={{ fontSize: "0.7vw", color: "#999" }}>{r.SKU}</div>
                      </td>
                      <td style={cell}>{r.Quantity}</td>
                      <td style={cell}>{r.Warehouse_Name}</td>
                      <td style={cell}>{r.bid_count}</td>
                      <td style={cell}>
                        <span
                          style={{
                            padding: "0.25vw 0.8vw",
                            borderRadius: "99vw",
                            fontSize: "0.75vw",
                            fontWeight: 600,
                            backgroundColor: c.bg,
                            color: c.text,
                          }}
                        >
                          {r.Status}
                        </span>
                      </td>
                      <td style={{ ...cell, color: "#888" }}>
                        {new Date(r.DateIssued).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* The floating popup, only while a request is selected */}
      {selectedId !== null && (
        <QuotationPanel
          prId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => setReloadKey((k) => k + 1)} // refresh the list after a bid / winner / cancel
        />
      )}
    </>
  );
}