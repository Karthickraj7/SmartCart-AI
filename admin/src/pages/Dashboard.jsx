import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, errMsg } from "../services/api";

const Card = ({ label, value }) => <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-stone-500">{label}</p><p className="text-2xl font-semibold">{value}</p></div>;

export default function Dashboard() {
  const { data: d, error, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: async () => (await api.get("/admin/analytics/")).data });
  const notes = useQuery({ queryKey: ["notes"], queryFn: async () => (await api.get("/notifications/")).data });
  if (isLoading) return <p className="animate-pulse">Loading…</p>;
  if (error) return <p role="alert">{errMsg(error)}</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Revenue" value={`₹${Number(d.revenue).toLocaleString("en-IN")}`} /><Card label="Orders" value={d.orders} />
        <Card label="Paid orders" value={d.paid_orders} /><Card label="Customers" value={d.customers} />
      </div>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-medium">Revenue, last 30 days</h2>
        {d.sales_by_day.length ? <div className="h-56"><ResponsiveContainer><BarChart data={d.sales_by_day}><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="revenue" fill="#1f6f5c" /></BarChart></ResponsiveContainer></div> : <p className="text-sm text-stone-500">No paid orders yet.</p>}
      </section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <List title="Top products" rows={d.top_products.map((p) => `${p.name} (${p.units})`)} />
        <List title="Low stock" rows={d.low_stock.map((p) => `${p.name}: ${p.quantity}`)} />
        <List title="Recent activity" rows={d.recent_activity.map((a) => `${a.action} ${a.target}`)} />
        <List title="Alerts" rows={(Array.isArray(notes.data) ? notes.data : []).filter((n) => !n.is_read).slice(0, 8).map((n) => n.message)} />
      </div>
    </div>
  );
}
const List = ({ title, rows }) => <section className="rounded-2xl bg-white p-4 shadow-sm"><h2 className="mb-2 font-medium">{title}</h2>{rows.length ? rows.map((r, i) => <p key={i} className="text-sm">{r}</p>) : <p className="text-sm text-stone-500">Nothing yet.</p>}</section>;
