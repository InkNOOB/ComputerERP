import Dashboard from "@/components/dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <div
      style={{
        backgroundColor: "#e9e9e9",
        borderRadius: "1.8vw",
        height: "calc(100vh - 2.28vw)",
        padding: "2vw",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "1.2vw",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.6vw", fontWeight: 700, color: "#668d98" }}>
        Dashboard
      </h1>

      <div style={{ flex: 1, minHeight: 0 }}>
        <Dashboard />
      </div>
    </div>
  );
}