import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";

export default function Inventory() {
  const qc = useQueryClient(); const [msg, setMsg] = useState("");
  const { data, isLoading, error } = useQuery({ queryKey: ["inv"], queryFn: async () => (await api.get("/inventory/")).data });
  const adjust = useMutation({ mutationFn: ({ id, delta, reason }) => api.post(`/inventory/${id}/adjust/`, { delta, reason }),
    onSuccess: () => { setMsg(""); qc.invalidateQueries({ queryKey: ["inv"] }); }, onError: (e) => setMsg(errMsg(e)) });
  if (isLoading) return <p className="animate-pulse">Loading…</p>;
  if (error) return <p role="alert">{errMsg(error)}</p>;
  return (
    <>
      {msg && <p role="alert" className="mb-2 text-red-600">{msg}</p>}
      <table className="w-full min-w-[500px] text-left text-sm"><thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Adjust</th></tr></thead>
        <tbody>{data.map((i) => (
          <tr key={i.product_id} className={`border-t ${i.low_stock ? "bg-amber-50" : ""}`}><td>{i.name}</td><td>{i.sku}</td><td>{i.quantity}{i.low_stock && " ⚠ low"}</td>
            <td><button className="mr-2 rounded border px-2" onClick={() => { const d = parseInt(prompt("Change by (e.g. 10 or -2)"), 10); if (!Number.isNaN(d)) adjust.mutate({ id: i.product_id, delta: d, reason: prompt("Reason") || "manual adjustment" }); }}>Adjust</button></td></tr>))}</tbody></table>
    </>
  );
}
