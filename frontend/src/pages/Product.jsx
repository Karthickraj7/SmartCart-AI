import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Facebook, Heart, Link2, Linkedin, Star, Twitter } from "lucide-react";
import Img from "../components/Img";
import ProductCard from "../components/ProductCard";
import { api, errMsg } from "../services/api";
import { useAuth } from "../context/Auth";
import { useUI } from "../context/UI";

const TABS = ["Description", "Additional Information", "Reviews"];

function Stars({ value = 0 }) {
  return <span className="flex gap-1" aria-label={`${value} out of 5`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={20} className={n <= Math.round(value) ? "fill-[#FFC700] text-[#FFC700]" : "text-g5"} />)}</span>;
}

export default function Product() {
  const { id } = useParams(); const nav = useNavigate(); const { authed } = useAuth(); const qc = useQueryClient(); const { setCartOpen, toggleCompare, compare, notify } = useUI();
  const [tab, setTab] = useState(TABS[0]); const [variant, setVariant] = useState(""); const [img, setImg] = useState(0); const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5); const [comment, setComment] = useState(""); const [note, setNote] = useState("");
  const { data: p, isLoading, error } = useQuery({ queryKey: ["product", id], queryFn: async () => (await api.get(`/products/${id}/`)).data });
  const rev = useQuery({ queryKey: ["reviews", id], queryFn: async () => (await api.get(`/products/${id}/reviews/`)).data });
  const rel = useQuery({ queryKey: ["related", id], queryFn: async () => (await api.get(`/products/${id}/related/`)).data });
  const add = useMutation({
    mutationFn: () => api.post("/cart/items/", { product_id: id, variant_id: variant || undefined, quantity: qty }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["cart"] }); setCartOpen(true); },
  });
  const wish = useMutation({ mutationFn: () => api.post("/wishlist/", { product_id: id }), onSuccess: () => notify("Saved to wishlist"), onError: (e) => notify(errMsg(e)) });
  const review = useMutation({
    mutationFn: () => api.post(`/products/${id}/reviews/`, { rating, comment }),
    onSuccess: () => { setNote("Thanks for your review!"); qc.invalidateQueries({ queryKey: ["reviews", id] }); }, onError: (e) => setNote(errMsg(e)),
  });
  if (isLoading) return <p className="container-page animate-pulse py-20">Loading…</p>;
  if (error) return <p role="alert" className="container-page py-20">{errMsg(error)}</p>;

  const variants = p.variants || [], chosen = variants.find((v) => String(v.id) === String(variant));
  const price = chosen ? chosen.price : p.final_price, needVariant = variants.length > 0 && !variant;
  const gate = (fn) => () => (authed ? fn() : nav("/login"));
  const url = encodeURIComponent(window.location.href);
  const specs = Object.entries(p.specifications || {});
  const copy = async () => { try { await navigator.clipboard.writeText(window.location.href); notify("Link copied"); } catch { notify(window.location.href); } };
  const meta = "grid grid-cols-[90px_12px_1fr] gap-x-2 text-base text-g3";

  return (
    <>
      <div className="bg-peach"><nav aria-label="Breadcrumb" className="mx-auto flex min-h-[100px] max-w-[1440px] flex-wrap items-center gap-3 px-4 py-6 text-base md:px-[99px]">
        <Link to="/" className="text-g3">Home</Link><ChevronRight size={18} className="text-g3" aria-hidden />
        <Link to="/shop" className="text-g3">Shop</Link><ChevronRight size={18} className="text-g3" aria-hidden />
        <span className="border-l-2 border-g9f pl-6">{p.name}</span>
      </nav></div>

      <div className="container-page grid gap-10 py-10 md:py-[35px] lg:grid-cols-2 lg:gap-[82px]">
        <div className="flex flex-col-reverse gap-6 md:flex-row">
          {p.images.length > 1 && <div className="flex gap-4 md:flex-col md:gap-8">{p.images.slice(0, 5).map((u, i) => (
            <button key={u} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`} className={`h-20 w-[76px] overflow-hidden rounded-[10px] bg-peach ${i === img ? "ring-2 ring-gold" : ""}`}><Img src={u} className="h-full w-full object-cover" /></button>))}</div>}
          <Img src={p.images[img]} alt={p.name} className="aspect-[423/500] w-full flex-1 rounded-[10px] bg-peach object-cover" />
        </div>
        <div>
          <h2 className="text-3xl font-normal md:text-[42px]">{p.name}</h2>
          <p className="mt-2 text-xl font-medium text-g3 md:text-2xl">₹{price} {!chosen && p.discount_percent > 0 && <s className="ml-2 text-base font-normal text-g4">₹{p.price}</s>}</p>
          <div className="mt-4 flex items-center gap-5">
            <Stars value={rev.data?.average || 0} />
            <span className="border-l border-g9f pl-5 text-[13px] text-g3">{rev.data?.count || 0} Customer Review{rev.data?.count === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-4 max-w-[424px] text-[13px]">{p.description || "No description yet."}</p>
          {variants.length > 0 && (
            <div className="mt-5"><p className="mb-3 text-sm text-g3">Option</p>
              <div className="flex flex-wrap gap-3">{variants.map((v) => (
                <button key={v.id} onClick={() => setVariant(String(v.id))} aria-pressed={String(v.id) === variant} className={`rounded-[5px] px-4 py-1.5 text-[13px] ${String(v.id) === variant ? "bg-gold text-white" : "bg-peach"}`}>{v.name}</button>))}</div></div>)}
          <p className="mt-5 text-sm">{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</p>
          {add.error && <p role="alert" className="mt-2 text-accent-red">{errMsg(add.error)}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-[123px] items-center justify-between rounded-[10px] border border-g9f px-4 md:h-16">
              <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span className="font-medium" aria-live="polite">{qty}</span>
              <button aria-label="Increase quantity" onClick={() => setQty(Math.min(Math.max(1, p.stock), qty + 1))}>+</button></div>
            <button className="btn-black w-[215px]" disabled={p.stock < 1 || add.isPending || needVariant} onClick={gate(add.mutate)}>Add To Cart</button>
            <button className="btn-black w-[215px]" onClick={() => toggleCompare(p.id)} aria-pressed={compare.includes(p.id)}><span className="text-2xl">+</span> Compare</button>
            <button className="btn-black !w-14 !px-0 md:!w-16" aria-label="Add to wishlist" onClick={gate(wish.mutate)}><Heart size={20} /></button>
          </div>
          {needVariant && <p className="mt-2 text-sm text-g3">Choose an option to add this item.</p>}
          <hr className="my-10 border-g5" />
          <div className="space-y-3">
            <p className={meta}><span>SKU</span><span>:</span><span>{p.sku}</span></p>
            <p className={meta}><span>Category</span><span>:</span><span>{p.category_name}</span></p>
            <div className={meta}><span>Share</span><span>:</span>
              <span className="flex items-center gap-4 text-black">
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noreferrer" aria-label="Share on Facebook"><Facebook size={20} /></a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noreferrer" aria-label="Share on LinkedIn"><Linkedin size={20} /></a>
                <a href={`https://twitter.com/intent/tweet?url=${url}&text=${encodeURIComponent(p.name)}`} target="_blank" rel="noreferrer" aria-label="Share on X"><Twitter size={20} /></a>
                <button onClick={copy} aria-label="Copy link"><Link2 size={20} /></button></span></div>
          </div>
        </div>
      </div>

      <section className="border-y border-g5" aria-label="Product information">
        <div className="container-page py-10">
          <div role="tablist" className="mb-8 flex flex-wrap justify-center gap-8 text-xl md:gap-[75px] md:text-2xl">
            {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={tab === t ? "font-medium text-black" : "text-g9f"}>{t === "Reviews" ? `Reviews [${rev.data?.count || 0}]` : t}</button>)}
          </div>
          <div role="tabpanel" className="mx-auto max-w-[1026px] text-base text-g9f">
            {tab === "Description" && <p className="whitespace-pre-line text-justify">{p.description || "No description yet."}</p>}
            {tab === "Additional Information" && (specs.length ? <table className="w-full text-left"><tbody>{specs.map(([k, v]) => <tr key={k} className="border-b"><th scope="row" className="w-1/3 py-3 font-medium capitalize text-black">{k}</th><td className="py-3">{String(v)}</td></tr>)}</tbody></table> : <p>No additional information.</p>)}
            {tab === "Reviews" && (
              <div className="text-black">
                {rev.data?.results.length === 0 && <p className="text-g9f">No reviews yet.</p>}
                {rev.data?.results.map((r, i) => <p key={i} className="border-b py-3 text-sm"><span className="mr-2">★{r.rating}</span>{r.comment} <span className="text-g9f">({r.author})</span></p>)}
                {authed && (
                  <form onSubmit={(e) => { e.preventDefault(); review.mutate(); }} className="mt-6 flex max-w-md flex-col gap-3">
                    <select className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))} aria-label="Rating">{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select>
                    <textarea className="input" placeholder="Share your experience (delivered orders only)" value={comment} onChange={(e) => setComment(e.target.value)} />
                    <button className="btn self-start">Submit review</button>
                    {note && <p role="status" className="text-sm">{note}</p>}
                  </form>)}
              </div>)}
          </div>
        </div>
      </section>

      {Array.isArray(rel.data) && rel.data.length > 0 && (
        <section className="container-page py-14">
          <h2 className="mb-10 text-center text-3xl font-medium md:text-4xl">Related Products</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{rel.data.map((r) => <ProductCard key={r.id} p={r} />)}</div>
          <div className="mt-10 text-center"><Link to={`/shop?category=${p.category_slug}`} className="btn-outline-gold w-[245px]">Show More</Link></div>
        </section>)}
    </>
  );
}
