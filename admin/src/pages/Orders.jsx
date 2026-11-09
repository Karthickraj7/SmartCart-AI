import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";

const NEXT = { pending: ["confirmed", "cancelled"], confirmed: ["processing", "cancelled"], processing: ["shipped", "cancelled"], shipped: ["delivered"], delivered: ["returned"] };

export default function Orders() {
  const qc = useQueryClient(); const [msg, setMsg] = useState("");
  const { data, isLoading, error } = useQuery({ queryKey: ["a-orders"], queryFn: async () => (await api.get("/orders/")).data });
  const opts = { onSuccess: () => { setMsg(""); qc.invalidateQueries({ queryKey: ["a-orders"] }); }, onError: (e) => setMsg(errMsg(e)) };
  const move = useMutation({ mutationFn: ({ id, status }) => api.post(`/orders/${id}/status/`, { status }), ...opts });
  const refund = useMutation({ mutationFn: (id) => api.post("/payments/refund/", { order_id: id }), ...opts });
  if (isLoading) return <p className="animate-pulse">Loading…</p>;
  if (error) return <p role="alert">{errMsg(error)}</p>;
  return (
    <>
      {msg && <p role="alert" className="mb-2 text-red-600">{msg}</p>}
      <table className="w-full min-w-[640px] text-left text-sm"><thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{data.map((o) => (
          <tr key={o.id} className="border-t"><td>{o.id}</td><td>{o.user_email}</td><td>₹{o.total}</td><td>{o.status}</td>
            <td className="space-x-2">{(NEXT[o.status] || []).map((s) => <button key={s} className="rounded border px-2" onClick={() => move.mutate({ id: o.id, status: s })}>{s}</button>)}
              {["returned", "cancelled"].includes(o.status) && <button className="rounded border border-red-400 px-2 text-red-600" onClick={() => confirm(`Refund order #${o.id}?`) && refund.mutate(o.id)}>refund</button>}</td></tr>))}</tbody></table>
    </>
  );
}
