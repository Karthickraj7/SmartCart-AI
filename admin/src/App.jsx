import { lazy, Suspense, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "./services/api";
import Login from "./pages/Login";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const Orders = lazy(() => import("./pages/Orders"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const Coupons = lazy(() => import("./pages/Coupons"));
const Team = lazy(() => import("./pages/Team"));
const SitePages = lazy(() => import("./pages/SitePages"));
const Inbox = lazy(() => import("./pages/Inbox"));
const People = lazy(() => import("./pages/People"));

const NAV = [["/", "Dashboard"], ["/products", "Products"], ["/orders", "Orders"], ["/inventory", "Inventory"], ["/knowledge", "AI knowledge"], ["/coupons", "Coupons"], ["/people", "Customers & chat"], ["/team", "Roles & audit"], ["/site", "Site pages"], ["/inbox", "Inbox"]];

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("access"));
  const me = useQuery({ queryKey: ["me"], enabled: authed, retry: false, queryFn: async () => (await api.get("/auth/me/")).data });
  const logout = () => { localStorage.clear(); setAuthed(false); };
  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  if (me.isLoading) return <p className="p-6 animate-pulse">Loading…</p>;
  if (me.error || !me.data || me.data.role === "customer")
    return <div className="p-6"><p role="alert">This account does not have admin access.</p><button className="btn mt-3" onClick={logout}>Log out</button></div>;
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="bg-brand-dark p-4 text-white md:w-56">
        <b className="font-display text-lg">Woodleaf Admin</b>
        <p className="mb-3 text-xs opacity-70">{me.data.email} · {me.data.role}</p>
        <nav className="flex flex-wrap gap-2 md:flex-col" aria-label="Admin">
          {NAV.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `rounded px-2 py-1 text-sm ${isActive ? "bg-white/20" : ""}`}>{label}</NavLink>)}
        </nav>
        <button className="mt-4 text-sm underline" onClick={logout}>Log out</button>
      </aside>
      <main className="flex-1 overflow-x-auto p-4">
        <Suspense fallback={<p className="animate-pulse">Loading…</p>}>
          <Routes>
            <Route path="/" element={<Dashboard />} /><Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} /><Route path="/inventory" element={<Inventory />} />
            <Route path="/knowledge" element={<Knowledge />} /><Route path="/people" element={<People />} /><Route path="/coupons" element={<Coupons />} /><Route path="/team" element={<Team />} /><Route path="/site" element={<SitePages />} /><Route path="/inbox" element={<Inbox />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
