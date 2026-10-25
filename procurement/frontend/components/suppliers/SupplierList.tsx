"use client";

import { useEffect, useState } from "react";

// The shape of one supplier, matching what the backend sends back
type Supplier = {
  SupplierID: number;
  SupplierName: string;
  Contact: string | null;
  Email: string | null;
};

export default function SupplierList({ limit }: { limit?: number }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]); // the data
  const [loading, setLoading] = useState(true);               // waiting for the backend?
  const [error, setError] = useState<string | null>(null);    // did something fail?

  // Runs once, when the component first appears on the page
  useEffect(() => {
    async function loadSuppliers() {
      try {
        // 1. Ask the backend for the data (this is the API call)
        const res = await fetch("http://127.0.0.1:8000/suppliers/");

        // 2. If the backend answered with an error code (404, 500...), stop here
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        // 3. Turn the response into a JavaScript array and save it
        const data = await res.json();
        setSuppliers(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false); // done waiting, whether it worked or failed
      }
    }

    loadSuppliers();
  }, []);

  if (loading) return <p>Loading suppliers...</p>;
  if (error) return <p>Failed to load: {error}</p>;
  if (suppliers.length === 0) return <p>No suppliers yet.</p>;

  const shown = limit ? suppliers.slice(0, limit) : suppliers;

  return (
    <div
    style={{
        fontSize: "2vw"
    }}
    >
    <ul>
      {shown.map((s) => (
        <li key={s.SupplierID}>
          {s.SupplierName} ({s.Email ?? "no email"})
        </li>
      ))}
    </ul>
    </div>
  );
}