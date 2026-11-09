import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, X } from "lucide-react";
import Img from "./Img";
import { api, errMsg } from "../services/api";
import { useAuth } from "../context/Auth";
import { useUI } from "../context/UI";

// Slide-in mini cart from the template ("Cart Sidebar").
export default function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI(); const { authed } = useAuth(); const qc = useQueryClient();
  const { data, error } = useQuery({ queryKey: ["cart"], enabled: authed, queryFn: async () => (await api.get("/cart/")).data });
  const remove = useMutation({ mutationFn: (id) => api.delete(`/cart/items/${id}/`), onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }) });
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);
  if (!cartOpen) return null;
  const close = () => setCartOpen(false);
  const pill = "rounded-full border border-black px-7 py-1.5 text-xs";
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={close}>
      <aside role="dialog" aria-modal="true" aria-label="Shopping cart" onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[417px] flex-col bg-white px-7 pt-7 shadow-xl">
        <div className="flex items-center justify-between border-b border-g5 pb-5">
          <h2 className="text-2xl font-semibold">Shopping Cart</h2>
          <button onClick={close} aria-label="Close cart"><X size={22} className="text-g3" /></button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto py-6">
          {!authed && <p>Please <Link to="/login" onClick={close} className="underline">log in</Link> to see your cart.</p>}
          {error && <p role="alert" className="text-accent-red">{errMsg(error)}</p>}
          {authed && data && data.items.length === 0 && <p>Your cart is empty.</p>}
          {data?.items.map((i) => (
            <div key={i.id} className="flex items-center gap-8">
              <Img src={i.image} alt="" className="h-[105px] w-[105px] shrink-0 rounded-[10px] bg-gold/20 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base">{i.name}{i.variant ? ` (${i.variant})` : ""}</p>
                <p className="mt-2 flex items-center gap-3 text-base font-light">{i.quantity}<span className="text-xs">X</span><span className="text-xs font-medium text-gold">₹{i.unit_price}</span></p>
              </div>
              <button onClick={() => remove.mutate(i.id)} aria-label={`Remove ${i.name}`}><Trash2 size={20} className="text-g4 hover:text-accent-red" /></button>
            </div>
          ))}
        </div>
        <div className="border-t border-g5 py-5">
          <p className="mb-6 flex justify-between text-base"><span>Subtotal</span><span className="font-semibold text-gold">₹{data?.subtotal ?? "0.00"}</span></p>
          <div className="mb-6 flex flex-wrap gap-3.5">
            <Link to="/cart" onClick={close} className={pill}>Cart</Link>
            <Link to="/checkout" onClick={close} className={pill}>Checkout</Link>
            <Link to="/compare" onClick={close} className={pill}>Comparison</Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
