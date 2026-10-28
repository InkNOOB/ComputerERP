"use client";

import { FormEvent, useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

type PurchaseRequest = {
  PR_ID: number;
  Status: "Open" | "Closed" | "Cancelled";
  Item_Name: string;
  SKU: string;
  Quantity: number;
  Warehouse_Name: string;
};

type Quotation = {
  RFQ_ID: number;
  SupplierID: number;
  SupplierName: string;
  QuotedAmount: number;
  DeliveryTerms: string | null;
  total_amount: number;
  PO_ID: number | null;
  is_winner: boolean;
};

type Supplier = { SupplierID: number; SupplierName: string };

type Props = {
  prId: number;
  onClose: () => void;
  onChanged: () => void;
};

const STATUS_COLORS = {
  Open: { bg: "#dff1ec", text: "#2a7a66" },
  Closed: { bg: "#e4e9ec", text: "#55656b" },
  Cancelled: { bg: "#f6e1e1", text: "#a14646" },
};

const money = (n: number) =>
  Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Turns a failed response into a readable message (our backend sends { detail: "..." })
async function readError(res: Response) {
  const body = await res.json().catch(() => null);
  if (typeof body?.detail === "string") return body.detail;
  if (Array.isArray(body?.detail)) return "Please check the values you entered";
  return `Request failed (${res.status})`;
}

const th = {
  padding: "0.6vw 1vw",
  textAlign: "left" as const,
  color: "#668d98",
  fontWeight: 600,
  borderBottom: "1px solid #e5e5e5",
};
const td = { padding: "0.7vw 1vw", textAlign: "left" as const };
const field = {
  padding: "0.5vw 0.9vw",
  fontSize: "0.85vw",
  borderRadius: "0.6vw",
  border: "1px solid #c9d6d9",
  outline: "none",
  fontFamily: "inherit",
  color: "#24363b",
  backgroundColor: "#ffffff",
};
const btn = (primary: boolean) => ({    
  padding: "0.45vw 1.1vw",
  borderRadius: "99vw",
  fontSize: "0.8vw",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  border: primary ? "none" : "1px solid #c9d6d9",
  backgroundColor: primary ? "#365f68" : "#ffffff",
  color: primary ? "#ffffff" : "#365f68",
});

export default function QuotationPanel({ prId, onClose, onChanged }: Props) {
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // "Add bid" form fields
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [terms, setTerms] = useState("");

  // Close with the Esc key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Load the request, its bids, and the supplier list (for the dropdown) in parallel
  useEffect(() => {
    async function load() {
      try {
        const [reqRes, qRes, sRes] = await Promise.all([
          fetch(`${API}/purchase-requests/${prId}`),
          fetch(`${API}/purchase-requests/${prId}/quotations/`),
          fetch(`${API}/suppliers/`),
        ]);
        if (!reqRes.ok) throw new Error(await readError(reqRes));
        if (!qRes.ok) throw new Error(await readError(qRes));
        if (!sRes.ok) throw new Error(await readError(sRes));
        setRequest(await reqRes.json());
        setQuotations(await qRes.json());
        setSuppliers(await sRes.json());
        setLoadError(null);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [prId, reloadKey]);

  // Runs any action (add bid / select winner / cancel), shows errors, then refreshes everything
  async function run(action: () => Promise<Response>, onSuccess?: () => void) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await action();
      if (!res.ok) {
        setActionError(await readError(res));
        return;
      }
      onSuccess?.();
      setReloadKey((k) => k + 1); // refresh this popup
      onChanged();                // refresh the list behind it
    } catch {
      setActionError("Could not reach the server");
    } finally {
      setBusy(false);
    }
  }

  function handleAddBid(e: FormEvent) {
    e.preventDefault();
    const price = Number(amount);
    if (!supplierId || !(price > 0)) {
      setActionError("Choose a supplier and enter a price above 0");
      return;
    }
    run(
      () =>
        fetch(`${API}/purchase-requests/${prId}/quotations/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplier_id: Number(supplierId),
            quoted_amount: price,
            delivery_terms: terms.trim() || null,
          }),
        }),
      () => {
        setSupplierId("");
        setAmount("");
        setTerms("");
      }
    );
  }

  function handleSelect(q: Quotation) {
    // The list is sorted cheapest first, so quotations[0] is the lowest bid
    const cheapest = quotations[0];
    const warning =
      cheapest && cheapest.RFQ_ID !== q.RFQ_ID && cheapest.QuotedAmount < q.QuotedAmount
        ? `\n\nNote: ${cheapest.SupplierName} offered a lower price.`
        : "";
    const ok = window.confirm(
      `Select ${q.SupplierName} (${money(q.total_amount)} total)?\nThis creates the purchase order and closes the request.${warning}`
    );
    if (!ok) return;
    run(() => fetch(`${API}/purchase-requests/${prId}/quotations/${q.RFQ_ID}/select`, { method: "POST" }));
  }

  function handleCancel() {
    if (!window.confirm("Cancel this request? This can't be undone.")) return;
    run(() => fetch(`${API}/purchase-requests/${prId}/cancel`, { method: "PATCH" }));
  }

  const isOpen = request?.Status === "Open";
  const alreadyBid = new Set(quotations.map((q) => q.SupplierID));
  const availableSuppliers = suppliers.filter((s) => !alreadyBid.has(s.SupplierID));
  const winner = quotations.find((q) => q.is_winner);

  return (
    // Dimmed overlay: clicking it closes the popup
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
      {/* The panel itself: clicks inside must not close it */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "60vw",
          maxHeight: "85vh",
          backgroundColor: "#ffffff",
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
              <h2 style={{ margin: 0, fontSize: "1.2vw", color: "#365f68" }}>Request #{prId}</h2>
              {request && (
                <span
                  style={{
                    padding: "0.25vw 0.8vw",
                    borderRadius: "99vw",
                    fontSize: "0.75vw",
                    fontWeight: 600,
                    backgroundColor: STATUS_COLORS[request.Status].bg,
                    color: STATUS_COLORS[request.Status].text,
                  }}
                >
                  {request.Status}
                </span>
              )}
            </div>
            {request && (
              <p style={{ margin: "0.4vw 0 0", color: "#668d98" }}>
                {request.Quantity} × {request.Item_Name} ({request.SKU}) → {request.Warehouse_Name}
              </p>
            )}
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
          {loading ? (
            <p style={{ color: "#888" }}>Loading...</p>
          ) : loadError ? (
            <p style={{ color: "#a14646" }}>Failed to load: {loadError}</p>
          ) : (
            <>
              {request?.Status === "Closed" && winner && (
                <p style={{ margin: "0 0 1vw", color: "#2a7a66", fontWeight: 600 }}>
                  Winner selected: {winner.SupplierName}, Purchase Order #{winner.PO_ID}
                </p>
              )}
              {request?.Status === "Cancelled" && (
                <p style={{ margin: "0 0 1vw", color: "#a14646", fontWeight: 600 }}>
                  This request was cancelled.
                </p>
              )}

              <h3 style={{ margin: "0 0 0.6vw", fontSize: "1vw", color: "#365f68" }}>
                Bids ({quotations.length})
              </h3>

              {quotations.length === 0 ? (
                <p style={{ color: "#888" }}>No bids yet.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>Supplier</th>
                      <th style={th}>Unit price</th>
                      <th style={th}>Total</th>
                      <th style={th}>Delivery terms</th>
                      <th style={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((q) => (
                      <tr
                        key={q.RFQ_ID}
                        style={{
                          borderBottom: "1px solid #f0f0f0",
                          backgroundColor: q.is_winner ? "#eef6f4" : "transparent",
                        }}
                      >
                        <td style={{ ...td, fontWeight: 500 }}>{q.SupplierName}</td>
                        <td style={td}>{money(q.QuotedAmount)}</td>
                        <td style={td}>{money(q.total_amount)}</td>
                        <td style={td}>{q.DeliveryTerms ?? <span style={{ color: "#aaa" }}>—</span>}</td>
                        <td style={{ ...td, textAlign: "right" }}>
                          {q.is_winner ? (
                            <span style={{ color: "#2a7a66", fontWeight: 600 }}>Winner</span>
                          ) : isOpen ? (
                            <button
                              onClick={() => handleSelect(q)}
                              disabled={busy}
                              style={{ ...btn(true), opacity: busy ? 0.5 : 1 }}
                            >
                              Select
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Add a bid (only while the request is Open) */}
              {isOpen && (
                <form
                  onSubmit={handleAddBid}
                  style={{ marginTop: "1.4vw", paddingTop: "1.2vw", borderTop: "1px solid #eee" }}
                >
                  <h3 style={{ margin: "0 0 0.6vw", fontSize: "1vw", color: "#365f68" }}>Add a bid</h3>
                  {availableSuppliers.length === 0 ? (
                    <p style={{ color: "#888", margin: 0 }}>Every supplier has already bid on this request.</p>
                  ) : (
                    <div style={{ display: "flex", gap: "0.7vw", alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        style={{ ...field, minWidth: "14vw" }}
                      >
                        <option value="">Choose supplier...</option>
                        {availableSuppliers.map((s) => (
                          <option key={s.SupplierID} value={s.SupplierID}>
                            {s.SupplierName}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Unit price"
                        style={{ ...field, width: "8vw" }}
                      />
                      <input
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        placeholder="Delivery terms (optional)"
                        style={{ ...field, flex: 1, minWidth: "12vw" }}
                      />
                      <button type="submit" disabled={busy} style={{ ...btn(true), opacity: busy ? 0.5 : 1 }}>
                        Add bid
                      </button>
                    </div>
                  )}
                </form>
              )}

              {actionError && (
                <p style={{ color: "#a14646", margin: "1vw 0 0", fontWeight: 500 }}>{actionError}</p>
              )}

              {/* Cancel (only while Open) */}
              {isOpen && (
                <div style={{ marginTop: "1.6vw", textAlign: "right" }}>
                  <button
                    onClick={handleCancel}
                    disabled={busy}
                    style={{ ...btn(false), color: "#a14646", opacity: busy ? 0.5 : 1 }}
                  >
                    Cancel request
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}