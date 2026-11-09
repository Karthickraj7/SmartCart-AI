import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";

const EMPTY = { name: "", slug: "", sku: "", price: "", category: "", description: "", initial_stock: 0 };

export default function Products() {
  const qc = useQueryClient(); const [f, setF] = useState(EMPTY); const [msg, setMsg] = useState("");
  const products = useQuery({ queryKey: ["a-products"], queryFn: async () => (await api.get("/products/")).data });
  const cats = useQuery({ queryKey: ["cats"], queryFn: async () => (await api.get("/categories/")).data });
  const [cat, setCat] = useState({ name: "", slug: "" });
  const addCat = useMutation({ mutationFn: () => api.post("/categories/", cat), onSuccess: () => { setCat({ name: "", slug: "" }); setMsg(""); qc.invalidateQueries({ queryKey: ["cats"] }); }, onError: (e) => setMsg(errMsg(e)) });
  const addVar = useMutation({ mutationFn: ({ id, name, price_override }) => api.post(`/products/${id}/variants/`, { name, price_override }), onSuccess: () => setMsg("Variant added."), onError: (e) => setMsg(errMsg(e)) });
  const done = () => qc.invalidateQueries({ queryKey: ["a-products"] });
  const create = useMutation({ mutationFn: () => api.post("/products/", f), onSuccess: () => { setF(EMPTY); setMsg(""); done(); }, onError: (e) => setMsg(errMsg(e)) });
  const del = useMutation({ mutationFn: (id) => api.delete(`/products/${id}/`), onSuccess: done, onError: (e) => setMsg(errMsg(e)) });
  const addImg = useMutation({ mutationFn: ({ id, url }) => api.post(`/products/${id}/images/`, { url }), onSuccess: done, onError: (e) => setMsg(errMsg(e)) });
  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); addCat.mutate(); }} className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <b className="w-full font-medium">New category</b>
        <input className="input w-auto" placeholder="name" required value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} aria-label="category name" />
        <input className="input w-auto" placeholder="slug" required value={cat.slug} onChange={(e) => setCat({ ...cat, slug: e.target.value })} aria-label="category slug" />
        <button className="btn">Add category</button>
      </form>
      <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-3">
        <h2 className="font-medium md:col-span-3">New product</h2>
        {["name", "slug", "sku", "price", "initial_stock"].map((k) => <input key={k} className="input" placeholder={k === "sku" ? "sku (blank = auto-generate)" : k} required={!["initial_stock", "sku"].includes(k)} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-label={k} />)}
        <select className="input" required value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} aria-label="category"><option value="">Category…</option>{cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <textarea className="input md:col-span-3" placeholder="description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        {msg && <p role="alert" className="text-red-600 md:col-span-3">{msg}</p>}
        <button className="btn md:col-span-3" disabled={create.isPending}>Create</button>
      </form>
      <table className="w-full min-w-[600px] text-left text-sm"><thead><tr><th>Name</th><th>SKU</th><th>₹</th><th>Stock</th><th>Active</th><th /></tr></thead>
        <tbody>{products.data?.results.map((p) => (
          <tr key={p.id} className="border-t"><td>{p.name}</td><td>{p.sku}</td><td>{p.final_price}</td><td>{p.stock}</td><td>{p.is_active ? "yes" : "no"}</td>
            <td className="space-x-3"><button className="underline" onClick={() => { const url = prompt("Image URL (https)"); if (url) addImg.mutate({ id: p.id, url }); }}>+ image</button>
              <button className="underline" onClick={() => { const name = prompt("Variant name (e.g. Large)"); if (name) addVar.mutate({ id: p.id, name, price_override: prompt("Variant price (blank = same)") || undefined }); }}>+ variant</button>
              <button className="text-red-600" onClick={() => confirm("Deactivate this product?") && del.mutate(p.id)}>Deactivate</button></td></tr>))}</tbody></table>
    </div>
  );
}
