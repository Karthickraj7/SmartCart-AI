import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";
import { useAuth } from "../context/Auth";

export default function Wishlist() {
  const { authed } = useAuth(); const qc = useQueryClient(); const [msg, setMsg] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["wishlist"], enabled: authed, queryFn: async () => (await api.get("/wishlist/")).data });
  const refresh = () => qc.invalidateQueries({ queryKey: ["wishlist"] });
  const remove = useMutation({ mutationFn: (id) => api.delete(`/wishlist/${id}/`), onSuccess: refresh });
  const toCart = useMutation({
    mutationFn: async (id) => { await api.post("/cart/items/", { product_id: id, quantity: 1 }); await api.delete(`/wishlist/${id}/`); },
    onSuccess: () => { setMsg("Moved to cart."); refresh(); }, onError: (e) => setMsg(errMsg(e)),
  });
  if (!authed) return <p><Link className="underline" to="/login">Log in</Link> to see your wishlist.</p>;
  if (isLoading) return <p className="animate-pulse">Loading…</p>;
  if (!data.length) return <p>Your wishlist is empty.</p>;
  return (
    <>
      <h1 className="mb-3 text-2xl font-medium">Wishlist</h1>
      {msg && <p role="status" className="mb-2 text-sm">{msg}</p>}
      {data.map((w) => (
        <div key={w.product_id} className="flex items-center justify-between border-b py-2 text-sm">
          <Link to={`/products/${w.product_id}`} className="underline">{w.name}</Link>
          <span>₹{w.price} <button className="ml-3 underline" onClick={() => toCart.mutate(w.product_id)}>Move to cart</button>
            <button className="ml-3 text-red-600" onClick={() => remove.mutate(w.product_id)}>Remove</button></span>
        </div>))}
    </>
  );
}
