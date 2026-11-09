import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";

const EMPTY = { code: "", percent: 10, min_order: 0, usage_limit: "", max_discount: "" };
export default function Coupons() {
  const qc = useQueryClient(); const [f, setF] = useState(EMPTY); const [msg, setMsg] = useState("");
  const list = useQuery({ queryKey: ["coupons"], queryFn: async () => (await api.get("/admin/coupons/")).data });
  const done = () => qc.invalidateQueries({ queryKey: ["coupons"] });
  const body = () => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ""));
  const create = useMutation({ mutationFn: () => api.post("/admin/coupons/", body()), onSuccess: () => { setF(EMPTY); setMsg(""); done(); }, onError: (e) => setMsg(errMsg(e)) });
  const toggle = useMutation({ mutationFn: (c) => api.patch(`/admin/coupons/${c.id}/`, { active: !c.active }), onSuccess: done });
  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-3">
        <h2 className="font-medium md:col-span-3">New coupon</h2>
        {Object.keys(EMPTY).map((k) => <input key={k} className="input" placeholder={k} required={k === "code" || k === "percent"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-label={k} />)}
        {msg && <p role="alert" className="text-red-600 md:col-span-3">{msg}</p>}
        <button className="btn md:col-span-3">Create</button>
      </form>
      <table className="w-full min-w-[500px] text-left text-sm"><thead><tr><th>Code</th><th>%</th><th>Used</th><th>Active</th></tr></thead>
        <tbody>{list.data?.results.map((c) => <tr key={c.id} className="border-t"><td>{c.code}</td><td>{c.percent}</td><td>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
          <td><button className="underline" onClick={() => toggle.mutate(c)}>{c.active ? "active (disable)" : "disabled (enable)"}</button></td></tr>)}</tbody></table>
    </div>
  );
}
