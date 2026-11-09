import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, errMsg } from "../services/api";
import { startPayment } from "../services/payment";

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];
function Tracker({ status }) {
  const i = STEPS.indexOf(status);
  if (i < 0) return <p className="text-sm text-g3">Status: {status}</p>;
  return <ol className="my-2 flex gap-1 text-xs" aria-label="Order tracking">{STEPS.map((x, n) => <li key={x} className={`flex-1 rounded px-1 py-0.5 text-center ${n <= i ? "bg-gold text-white" : "bg-g5"}`}>{x}</li>)}</ol>;
}

export default function Orders() {
  const qc = useQueryClient(); const nav = useNavigate(); const [msg, setMsg] = useState("");
  const pay = async (id) => { setMsg(""); try { await startPayment(id, { onSuccess: () => nav("/payment/success"), onFailure: () => nav("/payment/failed") }); } catch (e) { setMsg(errMsg(e)); } };
  const { data, error, isLoading } = useQuery({ queryKey: ["orders"], queryFn: async () => (await api.get("/orders/")).data });
  const act = useMutation({ mutationFn: ({ id, status }) => api.post(`/orders/${id}/status/`, { status }),
    onSuccess: () => { setMsg(""); qc.invalidateQueries({ queryKey: ["orders"] }); }, onError: (e) => setMsg(errMsg(e)) });
  if (isLoading) return <p className="animate-pulse">Loading…</p>;
  if (error) return <p role="alert">{errMsg(error)}</p>;
  if (!data.length) return <p>No orders yet.</p>;
  return (
    <>
      {msg && <p role="alert" className="mb-2 text-red-600">{msg}</p>}
      {data.map((o) => (
        <div key={o.id} className="mb-4 border border-g5 bg-white p-5">
          <div className="flex justify-between"><b>Order #{o.id}</b><span className="bg-peach px-3 text-sm text-gold">{o.status}</span></div>
          <Tracker status={o.status} />
          <p className="text-sm text-g2">{o.items.map((i) => `${i.name}${i.variant_name ? ` (${i.variant_name})` : ""} × ${i.quantity}`).join(", ")}</p>
          <p>Total ₹{o.total}{Number(o.discount) > 0 && ` (saved ₹${o.discount})`}</p>
          {o.status === "pending" && <div className="mt-2 flex gap-5 text-sm"><button className="font-semibold text-gold underline" onClick={() => pay(o.id)}>Pay now</button><button className="underline" onClick={() => act.mutate({ id: o.id, status: "cancelled" })}>Cancel order</button></div>}
          {o.status === "delivered" && <button className="mt-1 text-sm underline" onClick={() => act.mutate({ id: o.id, status: "returned" })}>Request return</button>}
        </div>))}
    </>
  );
}
