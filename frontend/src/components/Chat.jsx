import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { api, errMsg } from "../services/api";

export default function Chat() {
  const [open, setOpen] = useState(false); const [text, setText] = useState(""); const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Hi! Ask me about products, shipping, returns or your order." }]);
  const [busy, setBusy] = useState(false);
  if (import.meta.env.VITE_AI_CHAT_ENABLED === "false") return null;
  const send = async (e) => {
    e.preventDefault(); if (!text.trim() || busy) return;
    const m = text; setText(""); setBusy(true); setMsgs((x) => [...x, { role: "user", content: m }]);
    try {
      const { data } = await api.post("/chat/", { message: m, conversation_id: conv });
      setConv(data.conversation_id); setMsgs((x) => [...x, { role: "assistant", content: data.answer, sources: data.sources, id: data.message_id }]);
    } catch (err) { setMsgs((x) => [...x, { role: "assistant", content: errMsg(err) }]); }
    setBusy(false);
  };
  return (
    <div className="fixed bottom-4 right-4 z-20">
      {open ? (
        <div className="flex h-96 w-80 max-w-[90vw] flex-col rounded-2xl bg-white shadow-xl">
          <div className="flex justify-between rounded-t-2xl bg-brand p-3 text-white"><b>Shopping assistant</b><button onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button></div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <span className={`inline-block whitespace-pre-wrap rounded-xl px-3 py-2 ${m.role === "user" ? "bg-brand text-white" : "bg-stone-100"}`}>{m.content}</span>
                {m.id && <button className="ml-1 text-xs" aria-label="Helpful" onClick={() => api.post("/chat/feedback/", { message_id: m.id, helpful: true }).catch(() => {})}>👍</button>}
                {m.id && <button className="text-xs" aria-label="Not helpful" onClick={() => api.post("/chat/feedback/", { message_id: m.id, helpful: false }).catch(() => {})}>👎</button>}
                {m.sources?.length > 0 && <div className="mt-1 text-xs text-stone-500">Sources: {m.sources.map((s) => s.title).join(", ")}</div>}
              </div>
            ))}
            {busy && <p className="animate-pulse text-stone-400">Thinking…</p>}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t p-2">
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask anything…" aria-label="Message" />
            <button className="btn px-3" aria-label="Send"><Send size={16} /></button>
          </form>
        </div>
      ) : (
        <button className="btn h-12 w-12 !rounded-full !p-0" onClick={() => setOpen(true)} aria-label="Open assistant"><MessageCircle /></button>
      )}
    </div>
  );
}
