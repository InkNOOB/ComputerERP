import SupplierList from "@/components/suppliers/SupplierList";

export default function SuppliersPage() {
  return (
    <div
      style={{
        backgroundColor: "#e9e9e9",
        borderRadius: "1.8vw",
        height: "calc(100vh - 2.28vw)", // full height minus the layout's top and bottom padding
        padding: "2vw",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "1.2vw",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.6vw", fontWeight: 700, color: "#668d98" }}>
        Suppliers
      </h1>

      {/* flex: 1 + minHeight: 0 lets the list fill the rest and scroll inside */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <SupplierList />
      </div>
    </div>
  );
}