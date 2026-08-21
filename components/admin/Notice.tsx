export default function Notice({ type = "error", children }: { type?: "error" | "success"; children: React.ReactNode }) {
  const styles = type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700";
  return <div role={type === "error" ? "alert" : "status"} className={`mt-5 rounded-lg border px-3 py-2 text-sm ${styles}`}>{children}</div>;
}
