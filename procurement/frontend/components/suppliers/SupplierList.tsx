"use client";

import { useEffect, useState } from "react";

type Supplier = {
  SupplierID: number;
  SupplierName: string;
  Contact: string | null;
  Email: string | null;
};

export default function SupplierList({ limit }: { limit?: number }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://127.0.0.1:8000/suppliers/");
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        setSuppliers(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter by name as the user types (happens in the browser, no backend call)
  const filtered = suppliers.filter((s) =>
    s.SupplierName.toLowerCase().includes(search.toLowerCase())
  );
  const shown = limit ? filtered.slice(0, limit) : filtered;

  const note = (text: string) => (
    <p style={{ padding: "2vw", textAlign: "center", color: "#888", fontSize: "0.85vw", margin: 0 }}>
      {text}
    </p>
  );

  const cell = { padding: "0.8vw 1.4vw", textAlign: "left" as const };
  const empty = <span style={{ color: "#aaa" }}>—</span>;

  return (
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
      {/* Search + count (hidden when used as a small dashboard widget) */}
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
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier name..."
            style={{
              width: "20vw",
              padding: "0.5vw 1vw",
              fontSize: "0.85vw",
              borderRadius: "99vw",
              border: "1px solid #c9d6d9",
              outline: "none",
              color: "#000000"
            }}
          />
          <span style={{ fontSize: "0.8vw", color: "#668d98" }}>
            {filtered.length} {filtered.length === 1 ? "supplier" : "suppliers"}
          </span>
        </div>
      )}

      {/* The scrolling area */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          note("Loading suppliers...")
        ) : error ? (
          note(`Failed to load: ${error}`)
        ) : shown.length === 0 ? (
          note(search ? "No suppliers match your search." : "No suppliers yet.")
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85vw" }}>
            <thead>
              <tr>
                {["ID", "Name", "Contact", "Email"].map((h) => (
                  <th
                    key={h}
                    style={{
                      ...cell,
                      position: "sticky", // header stays visible while scrolling
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
            <tbody
            style={{
                color: "#717f8b"
            }}
            >
              {shown.map((s) => (
                <tr key={s.SupplierID} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ ...cell, color: "#888" }}>{s.SupplierID}</td>
                  <td style={{ ...cell, fontWeight: 500 }}>{s.SupplierName}</td>
                  <td style={cell}>{s.Contact ?? empty}</td>
                  <td style={cell}>{s.Email ?? empty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}