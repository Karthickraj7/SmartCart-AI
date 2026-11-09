import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Star, X } from "lucide-react";
import Page from "../components/Page";
import Img from "../components/Img";
import { api } from "../services/api";
import { useAuth } from "../context/Auth";
import { useUI } from "../context/UI";

export default function Compare() {
  const { compare, toggleCompare, notify } = useUI(); const { authed } = useAuth();
  const items = useQueries({ queries: compare.map((id) => ({ queryKey: ["compare", id], queryFn: async () => {
    const [p, r] = await Promise.all([api.get(`/products/${id}/`), api.get(`/products/${id}/reviews/`)]);
    return { ...p.data, rating: r.data.average, reviews: r.data.count };
  } })) });
  const all = useQuery({ queryKey: ["compare-pick"], queryFn: async () => (await api.get("/products/", { params: { page_size: 48 } })).data.results });
  const loaded = items.filter((q) => q.data).map((q) => q.data);
  const keys = [...new Set(loaded.flatMap((p) => Object.keys(p.specifications || {})))];
  const cell = "border-l border-g5 px-4 py-4 align-top text-base text-g9f md:px-8";
  const head = "py-4 pr-4 align-top text-base font-medium text-black";

  const addToCart = async (p) => {
    try { await api.post("/cart/items/", { product_id: p.id, quantity: 1 }); notify("Added to cart"); } catch (e) { notify(e.response?.data?.errors?.[0] || e.response?.data?.detail || "Could not add to cart"); }
  };
  return (
    <Page title="Product Comparison" crumbs={[{ label: "Comparison" }]} strip>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[223px] text-2xl font-medium leading-tight">Go to Product page for more Products</p>
        <div className="flex items-center gap-4">
          <Link to="/shop" className="border-b border-black pb-1 text-xl font-medium text-g3">View More</Link>
          {compare.length < 3 && (
            <select className="input !w-60" value="" aria-label="Add a product" onChange={(e) => e.target.value && toggleCompare(Number(e.target.value))}>
              <option value="">Add a product…</option>
              {(all.data || []).filter((p) => !compare.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>)}
        </div>
      </div>
      {compare.length === 0 && <p className="py-10 text-g3">Nothing to compare yet. Use the Compare button on any product, or add one above.</p>}
      {loaded.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead><tr><td />{loaded.map((p) => (
              <th key={p.id} className="border-l border-g5 px-4 pb-6 text-left align-top font-normal md:px-8">
                <div className="relative"><Img src={p.images?.[0]} alt={p.name} className="mb-4 aspect-[280/177] w-full max-w-[280px] rounded-[10px] bg-peach object-cover" />
                  <button onClick={() => toggleCompare(p.id)} aria-label={`Remove ${p.name}`} className="absolute right-2 top-2 rounded-full bg-white p-1 shadow"><X size={16} /></button></div>
                <Link to={`/products/${p.id}`} className="text-2xl font-medium text-black">{p.name}</Link>
                <p className="mt-2 text-lg font-medium text-black">₹{p.final_price}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-g9f"><Star size={16} className="fill-[#FFC700] text-[#FFC700]" aria-hidden />{p.rating ?? "–"} · {p.reviews} review{p.reviews === 1 ? "" : "s"}</p>
              </th>))}</tr></thead>
            <tbody className="border-t border-g5">
              <tr><th scope="row" colSpan={loaded.length + 1} className="pb-2 pt-8 text-2xl font-medium">General</th></tr>
              <tr><th scope="row" className={head}>SKU</th>{loaded.map((p) => <td key={p.id} className={cell}>{p.sku}</td>)}</tr>
              <tr><th scope="row" className={head}>Category</th>{loaded.map((p) => <td key={p.id} className={cell}>{p.category_name}</td>)}</tr>
              <tr><th scope="row" className={head}>Availability</th>{loaded.map((p) => <td key={p.id} className={cell}>{p.stock > 0 ? "In stock" : "Out of stock"}</td>)}</tr>
              <tr><th scope="row" className={head}>Options</th>{loaded.map((p) => <td key={p.id} className={cell}>{p.variants?.length ? p.variants.map((v) => v.name).join(", ") : "–"}</td>)}</tr>
              {keys.length > 0 && <tr><th scope="row" colSpan={loaded.length + 1} className="pb-2 pt-8 text-2xl font-medium">Specifications</th></tr>}
              {keys.map((k) => <tr key={k}><th scope="row" className={`${head} capitalize`}>{k}</th>{loaded.map((p) => <td key={p.id} className={cell}>{p.specifications?.[k] ?? "–"}</td>)}</tr>)}
              <tr><td />{loaded.map((p) => (
                <td key={p.id} className="border-l border-g5 px-4 py-8 md:px-8">
                  {p.variants?.length || !authed
                    ? <Link to={p.variants?.length ? `/products/${p.id}` : "/login"} className="btn-black w-full max-w-[215px] !h-14">{p.variants?.length ? "Choose option" : "Log in to buy"}</Link>
                    : <button className="btn-black w-full max-w-[215px] !h-14" disabled={p.stock < 1} onClick={() => addToCart(p)}>Add To Cart</button>}
                </td>))}</tr>
            </tbody>
          </table>
        </div>)}
    </Page>
  );
}
