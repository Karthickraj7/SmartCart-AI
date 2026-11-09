import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Page from "../components/Page";
import Img from "../components/Img";
import { api, errMsg } from "../services/api";
import { useAuth } from "../context/Auth";

export default function Cart() {
  const { authed } = useAuth(); const qc = useQueryClient(); const [msg, setMsg] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["cart"], enabled: authed, queryFn: async () => (await api.get("/cart/")).data });
  const refresh = { onSuccess: () => { setMsg(""); qc.invalidateQueries({ queryKey: ["cart"] }); }, onError: (e) => setMsg(errMsg(e)) };
  const setQty = useMutation({ mutationFn: ({ id, quantity }) => api.patch(`/cart/items/${id}/`, { quantity }), ...refresh });
  const remove = useMutation({ mutationFn: (id) => api.delete(`/cart/items/${id}/`), ...refresh });

  let body;
  if (!authed) body = <p><Link className="underline" to="/login">Log in</Link> to see your cart.</p>;
  else if (isLoading) body = <p className="animate-pulse">Loading…</p>;
  else if (!data?.items.length) body = <p>Your cart is empty. <Link to="/shop" className="underline">Continue shopping</Link></p>;
  else body = (
    <div className="grid gap-8 lg:grid-cols-[1fr_393px]">
      <section aria-label="Cart items">
        {msg && <p role="alert" className="mb-4 text-accent-red">{msg}</p>}
        <div className="hidden h-[55px] grid-cols-[2fr_1fr_1fr_1fr_40px] items-center bg-peach px-6 font-medium md:grid"><span>Product</span><span>Price</span><span>Quantity</span><span>Subtotal</span><span /></div>
        {data.items.map((i) => (
          <div key={i.id} className="grid grid-cols-[105px_1fr] items-center gap-x-6 gap-y-3 border-b py-6 md:grid-cols-[2fr_1fr_1fr_1fr_40px] md:px-6 md:py-8">
            <div className="flex items-center gap-6 md:gap-8">
              <Img src={i.image} alt="" className="h-[105px] w-[105px] shrink-0 rounded-[10px] bg-gold/20 object-cover" />
              <span className="hidden text-g9f md:block">{i.name}{i.variant ? ` (${i.variant})` : ""}</span>
            </div>
            <div className="md:contents">
              <p className="mb-2 text-g9f md:hidden">{i.name}{i.variant ? ` (${i.variant})` : ""}</p>
              <p className="text-g9f md:text-base">₹{i.unit_price}</p>
            </div>
            <div className="col-span-2 flex items-center gap-3 md:col-span-1">
              <div className="flex h-8 items-center rounded-[5px] border border-g9f">
                <button className="px-2" aria-label={`Decrease ${i.name}`} disabled={i.quantity <= 1} onClick={() => setQty.mutate({ id: i.id, quantity: i.quantity - 1 })}>−</button>
                <span className="min-w-6 text-center">{i.quantity}</span>
                <button className="px-2" aria-label={`Increase ${i.name}`} onClick={() => setQty.mutate({ id: i.id, quantity: i.quantity + 1 })}>+</button>
              </div>
            </div>
            <p className="col-span-2 md:col-span-1">₹{i.line_total}</p>
            <button onClick={() => remove.mutate(i.id)} aria-label={`Remove ${i.name}`} className="justify-self-end text-gold hover:text-accent-red"><Trash2 size={26} /></button>
          </div>))}
      </section>
      <aside className="h-fit bg-peach px-8 pb-10 pt-4 text-center" aria-label="Cart totals">
        <h2 className="mb-8 text-3xl font-semibold md:text-[32px]">Cart Totals</h2>
        <dl className="space-y-5 text-left text-base">
          <div className="flex justify-between gap-6"><dt className="font-medium">Subtotal</dt><dd className="text-g9f">₹{data.subtotal}</dd></div>
          <div className="flex justify-between gap-6"><dt className="font-medium">Delivery</dt><dd className="text-g9f">{Number(data.delivery_fee) ? `₹${data.delivery_fee}` : "Free"}</dd></div>
          <div className="flex justify-between gap-6"><dt className="font-medium">Tax</dt><dd className="text-g9f">₹{data.tax}</dd></div>
          <div className="flex justify-between gap-6"><dt className="font-medium">Total</dt><dd className="text-xl font-medium text-gold">₹{data.total}</dd></div>
        </dl>
        <Link to="/checkout" className="btn-black mt-10 !h-[59px] w-[222px] text-xl">Check Out</Link>
      </aside>
    </div>
  );
  return <Page title="Cart" crumbs={[{ label: "Cart" }]} strip>{body}</Page>;
}
