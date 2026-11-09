import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";
import { useAuth } from "../context/Auth";

const EMPTY = { name: "", line1: "", city: "", state: "", pincode: "", phone: "" };

export default function Account() {
  const { authed } = useAuth(); const qc = useQueryClient();
  const [msg, setMsg] = useState(""); const [addr, setAddr] = useState(EMPTY); const [form, setForm] = useState(null);
  const me = useQuery({ queryKey: ["me"], enabled: authed, queryFn: async () => (await api.get("/auth/me/")).data });
  const addrs = useQuery({ queryKey: ["addresses"], enabled: authed, queryFn: async () => (await api.get("/auth/addresses/")).data });
  const save = useMutation({ mutationFn: () => api.patch("/auth/me/", form), onSuccess: () => { setMsg("Profile saved."); qc.invalidateQueries({ queryKey: ["me"] }); }, onError: (e) => setMsg(errMsg(e)) });
  const add = useMutation({ mutationFn: () => api.post("/auth/addresses/", addr), onSuccess: () => { setAddr(EMPTY); setMsg(""); qc.invalidateQueries({ queryKey: ["addresses"] }); }, onError: (e) => setMsg(errMsg(e)) });
  const del = useMutation({ mutationFn: (id) => api.delete(`/auth/addresses/${id}/`), onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }) });
  if (!authed) return <p><Link className="underline" to="/login">Log in</Link> to manage your account.</p>;
  if (!me.data) return <p className="animate-pulse">Loading…</p>;
  const f = form || me.data;
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section className="space-y-2">
        <h1 className="text-2xl font-medium">Profile</h1>
        <p className="text-sm text-stone-500">{me.data.email}</p>
        {["first_name", "last_name", "phone"].map((k) => <input key={k} className="input" placeholder={k} value={f[k] || ""} onChange={(e) => setForm({ ...f, [k]: e.target.value })} aria-label={k} />)}
        <button className="btn" onClick={() => save.mutate()}>Save profile</button>
        {msg && <p role="status" className="text-sm">{msg}</p>}
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-medium">Saved addresses</h2>
        {addrs.data?.results.map((a) => <p key={a.id} className="text-sm">{a.name}, {a.line1}, {a.city} {a.pincode} <button className="ml-2 text-red-600" onClick={() => del.mutate(a.id)}>Delete</button></p>)}
        {Object.keys(EMPTY).map((k) => <input key={k} className="input" placeholder={k} value={addr[k]} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })} aria-label={`new ${k}`} />)}
        <button className="btn" onClick={() => add.mutate()}>Add address</button>
      </section>
    </div>
  );
}
