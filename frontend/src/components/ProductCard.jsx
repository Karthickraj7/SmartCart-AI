import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { GitCompare, Heart, Share2 } from "lucide-react";
import Img from "./Img";
import { api, errMsg } from "../services/api";
import { useAuth } from "../context/Auth";
import { useUI } from "../context/UI";

const DAY = 86400000;
export const isNew = (p) => p.created_at && Date.now() - new Date(p.created_at).getTime() < 14 * DAY;

// Product card from the template: image, light footer, discount/new badge and a hover overlay with quick actions.
export default function ProductCard({ p }) {
  const nav = useNavigate(); const qc = useQueryClient(); const { authed } = useAuth(); const { setCartOpen, toggleCompare, compare, notify } = useUI();
  const to = `/products/${p.id}`;
  const soldOut = p.stock < 1;
  const stop = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); fn(); };

  const addToCart = async () => {
    if (!authed) return nav("/login");
    if (p.variants?.length) return nav(to);  // a variant must be chosen on the product page
    try { await api.post("/cart/items/", { product_id: p.id, quantity: 1 }); await qc.invalidateQueries({ queryKey: ["cart"] }); setCartOpen(true); }
    catch (e) { notify(errMsg(e)); }
  };
  const like = async () => {
    if (!authed) return nav("/login");
    try { await api.post("/wishlist/", { product_id: p.id }); notify("Saved to wishlist"); } catch (e) { notify(errMsg(e)); }
  };
  const share = async () => {
    const url = `${window.location.origin}${to}`;
    try { if (navigator.share) await navigator.share({ title: p.name, url }); else { await navigator.clipboard.writeText(url); notify("Link copied"); } }
    catch { notify(url); }
  };

  const action = "flex items-center gap-1 text-base font-semibold text-white";
  return (
    <article className="group relative overflow-hidden bg-light" data-testid="product-card">
      <Link to={to} className="block" aria-label={p.name}>
        <div className="relative aspect-[285/301] bg-peach">
          <Img src={p.images?.[0]} alt={p.name} className="h-full w-full bg-peach object-cover" />
          {p.discount_percent > 0
            ? <span className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent-red text-base font-medium text-white">-{p.discount_percent}%</span>
            : isNew(p) && <span className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent-green text-base font-medium text-white">New</span>}
        </div>
        <div className="p-4">
          <h3 className="text-2xl font-semibold leading-tight text-g1">{p.name}</h3>
          <p className="mt-2 text-base font-medium text-g3">{p.category_name}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 text-xl font-semibold text-g1">
            ₹{p.final_price}
            {p.discount_percent > 0 && <s className="text-base font-normal text-g4">₹{p.price}</s>}
          </p>
        </div>
      </Link>
      <div onClick={() => nav(to)} className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-6 bg-g1/70 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
        <button onClick={stop(addToCart)} disabled={soldOut} className="h-12 w-[202px] bg-white text-base font-semibold text-gold disabled:cursor-not-allowed disabled:text-g3">
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
        <div className="flex items-center gap-5">
          <button onClick={stop(share)} className={action}><Share2 size={16} aria-hidden />Share</button>
          <button onClick={stop(() => toggleCompare(p.id))} aria-pressed={compare.includes(p.id)} className={action}><GitCompare size={16} aria-hidden />Compare</button>
          <button onClick={stop(like)} className={action}><Heart size={16} aria-hidden />Like</button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return <div className="aspect-[285/446] animate-pulse bg-light" aria-hidden />;
}
