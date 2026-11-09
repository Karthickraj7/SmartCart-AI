import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";

function AiTools() {
  const qc = useQueryClient(); const [q, setQ] = useState(""); const [msg, setMsg] = useState("");
  const cfg = useQuery({ queryKey: ["ai-config"], queryFn: async () => (await api.get("/knowledge/config/")).data });
  const [f, setF] = useState(null); const c = f || cfg.data;
  const save = useMutation({ mutationFn: () => api.put("/knowledge/config/", c), onSuccess: () => { setMsg("Saved."); setF(null); qc.invalidateQueries({ queryKey: ["ai-config"] }); }, onError: (e) => setMsg(errMsg(e)) });
  const test = useMutation({ mutationFn: () => api.post("/knowledge/retrieval-test/", { query: q }).then((r) => r.data), onError: (e) => setMsg(errMsg(e)) });
  if (!c) return null;
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-medium">Assistant settings</h2>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label>Min score <input className="input w-24" type="number" step="0.05" min="0" max="1" value={c.min_score} onChange={(e) => setF({ ...c, min_score: e.target.value })} /></label>
        <label>Passages <input className="input w-20" type="number" min="1" max="10" value={c.top_k} onChange={(e) => setF({ ...c, top_k: e.target.value })} /></label>
        <label><input type="checkbox" checked={c.llm_enabled} onChange={(e) => setF({ ...c, llm_enabled: e.target.checked })} /> Use LLM to phrase answers</label>
        <span className="text-stone-500">Embeddings: {c.embedding_provider}</span>
        <button className="btn" onClick={() => save.mutate()}>Save</button>
      </div>
      {msg && <p role="status" className="text-sm">{msg}</p>}
      <h3 className="pt-2 font-medium">Retrieval tester</h3>
      <form onSubmit={(e) => { e.preventDefault(); test.mutate(); }} className="flex gap-2"><input className="input" placeholder="Try a customer question…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Test question" /><button className="btn">Test</button></form>
      {test.data && <div className="text-sm"><p className="text-stone-500">{test.data.latency_ms} ms · {test.data.vector_index ? "pgvector index" : "in-memory scan"}</p>
        {test.data.results.length === 0 ? <p>No passages matched.</p> : test.data.results.map((r, i) => <p key={i} className="border-t py-1"><b>{r.score}</b> · {r.document} <span className="text-stone-400">({r.embedder})</span><br />{r.snippet}</p>)}</div>}
    </section>
  );
}

export default function Knowledge() {
  const qc = useQueryClient(); const [title, setTitle] = useState(""); const [text, setText] = useState(""); const [file, setFile] = useState(null); const [msg, setMsg] = useState("");
  const docs = useQuery({ queryKey: ["docs"], refetchInterval: 5000, queryFn: async () => (await api.get("/knowledge/status/")).data });
  const refresh = () => qc.invalidateQueries({ queryKey: ["docs"] });
  const upload = useMutation({
    mutationFn: () => { const fd = new FormData(); fd.append("title", title); if (file) fd.append("file", file); else fd.append("text", text); return api.post("/knowledge/ingest/", fd); },
    onSuccess: () => { setTitle(""); setText(""); setFile(null); setMsg(""); refresh(); }, onError: (e) => setMsg(errMsg(e)),
  });
  const reindex = useMutation({ mutationFn: (id) => api.post(`/knowledge/${id}/`), onSuccess: refresh });
  const del = useMutation({ mutationFn: (id) => api.delete(`/knowledge/${id}/`), onSuccess: refresh });
  return (
    <div className="space-y-6">
      <AiTools />
      <form onSubmit={(e) => { e.preventDefault(); upload.mutate(); }} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-medium">Add knowledge (policy, FAQ, product guide)</h2>
        <input className="input" placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="input" rows={4} placeholder="Paste text, or choose a file below" value={text} onChange={(e) => setText(e.target.value)} />
        <input type="file" accept=".txt,.md,.pdf" onChange={(e) => setFile(e.target.files[0] || null)} aria-label="File" />
        {msg && <p role="alert" className="text-red-600">{msg}</p>}
        <button className="btn" disabled={upload.isPending}>{upload.isPending ? "Indexing…" : "Upload & index"}</button>
      </form>
      <table className="w-full min-w-[500px] text-left text-sm"><thead><tr><th>Title</th><th>Status</th><th>Chunks</th><th /></tr></thead>
        <tbody>{docs.data?.map((d) => (
          <tr key={d.id} className="border-t"><td>{d.title}</td><td>{d.status}{d.error && ` – ${d.error}`}</td><td>{d.chunks}</td>
            <td className="space-x-3"><button className="underline" onClick={() => reindex.mutate(d.id)}>Re-index</button><button className="text-red-600" onClick={() => confirm("Delete document?") && del.mutate(d.id)}>Delete</button></td></tr>))}</tbody></table>
    </div>
  );
}
