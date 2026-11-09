import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";

export default function People() {
  const [cust, setCust] = useState(null); const [conv, setConv] = useState(null);
  const customers = useQuery({ queryKey: ["cust"], queryFn: async () => (await api.get("/admin/customers/")).data });
  const chat = useQuery({ queryKey: ["chats"], queryFn: async () => (await api.get("/admin/conversations/")).data });
  const detail = useQuery({ queryKey: ["cust", cust], enabled: !!cust, queryFn: async () => (await api.get(`/admin/customers/${cust}/`)).data });
  const thread = useQuery({ queryKey: ["conv", conv], enabled: !!conv, queryFn: async () => (await api.get(`/admin/conversations/${conv}/`)).data });
  return (
    <div className="space-y-6">
      <section><h2 className="mb-2 font-medium">Customers</h2>
        {customers.error ? <p role="alert">{errMsg(customers.error)}</p> : (
          <table className="w-full min-w-[480px] text-left text-sm"><thead><tr><th>Email</th><th>Name</th><th>Orders</th><th /></tr></thead>
            <tbody>{customers.data?.map((c) => <tr key={c.id} className="border-t"><td>{c.email}</td><td>{c.name}</td><td>{c.orders}</td><td><button className="underline" onClick={() => setCust(c.id)}>View</button></td></tr>)}</tbody></table>)}
        {detail.data && <div className="mt-3 rounded-2xl bg-white p-4 text-sm shadow-sm"><b>{detail.data.email}</b> · spent ₹{detail.data.total_spent} · joined {new Date(detail.data.joined).toLocaleDateString()}
          {detail.data.orders.map((o) => <p key={o.id}>Order #{o.id} · {o.status} · ₹{o.total}</p>)}
          {detail.data.orders.length === 0 && <p className="text-stone-500">No orders.</p>}
          {detail.data.conversations.map((c) => <button key={c.id} className="mr-3 underline" onClick={() => setConv(c.id)}>Chat #{c.id} ({c.messages})</button>)}</div>}
      </section>
      <section><h2 className="mb-2 font-medium">Chatbot</h2>
        {chat.error ? <p role="alert">{errMsg(chat.error)}</p> : <>
          <p className="text-sm">Feedback: 👍 {chat.data?.feedback?.true || 0} · 👎 {chat.data?.feedback?.false || 0} · Conversations: {chat.data?.conversations.length}</p>
          {chat.data?.conversations.slice(0, 10).map((c) => <p key={c.id} className="text-sm"><button className="underline" onClick={() => setConv(c.id)}>#{c.id}</button> {c.user || "guest"} – {c.messages} messages</p>)}</>}
        {thread.data && <div className="mt-3 space-y-1 rounded-2xl bg-white p-4 text-sm shadow-sm">{thread.data.messages.map((m) => <p key={m.id}><b>{m.role}:</b> {m.content} {m.feedback.map((h, i) => <span key={i}>{h ? "👍" : "👎"}</span>)}</p>)}</div>}
      </section>
    </div>
  );
}
