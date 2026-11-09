import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";

const SLUGS = [["about", "About"], ["contact", "Contact"], ["faq", "FAQ"], ["privacy", "Privacy Policy"], ["terms", "Terms"], ["returns", "Returns & Refunds"]];
export default function SitePages() {
  const qc = useQueryClient(); const [slug, setSlug] = useState("about"); const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [msg, setMsg] = useState("");
  const page = useQuery({ queryKey: ["page", slug], retry: false, queryFn: async () => (await api.get(`/pages/${slug}/`)).data });
  useEffect(() => { setTitle(page.data?.title || SLUGS.find((s) => s[0] === slug)[1]); setBody(page.data?.body || ""); setMsg(""); }, [page.data, slug]);
  const save = useMutation({ mutationFn: () => api.put(`/pages/${slug}/`, { title, body }),
    onSuccess: () => { setMsg("Published."); qc.invalidateQueries({ queryKey: ["page", slug] }); }, onError: (e) => setMsg(errMsg(e)) });
  return (
    <div className="max-w-2xl space-y-3">
      <h2 className="font-medium">Site pages (Super Admin)</h2>
      <p className="text-sm text-stone-500">Legal pages (privacy, terms, returns) should be reviewed by a qualified professional before publishing.</p>
      <select className="input" value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Page">{SLUGS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
      <textarea className="input" rows={12} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Body" />
      {msg && <p role="status" className="text-sm">{msg}</p>}
      <button className="btn" onClick={() => save.mutate()} disabled={save.isPending}>Publish</button>
    </div>
  );
}
