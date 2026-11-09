import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";

export default function Inbox() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["inbox"], queryFn: async () => (await api.get("/admin/inbox/")).data });
  const mark = useMutation({ mutationFn: ({ id, handled }) => api.post(`/admin/inbox/${id}/handled/`, { handled }), onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox"] }) });
  if (isLoading) return <p className="animate-pulse">Loading…</p>;
  if (error) return <p role="alert">{errMsg(error)}</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">Contact-form messages from the storefront · {data.subscribers} newsletter subscriber{data.subscribers === 1 ? "" : "s"}</p>
      {data.messages.length === 0 && <p>No messages yet.</p>}
      {data.messages.map((m) => (
        <article key={m.id} className={`rounded-2xl bg-white p-4 shadow-sm ${m.handled ? "opacity-60" : ""}`}>
          <p className="text-sm"><b>{m.name}</b> · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a> · {new Date(m.created_at).toLocaleString()}</p>
          {m.subject && <p className="mt-1 font-medium">{m.subject}</p>}
          <p className="mt-1 whitespace-pre-wrap text-sm">{m.message}</p>
          <button className="mt-2 text-sm underline" onClick={() => mark.mutate({ id: m.id, handled: !m.handled })}>{m.handled ? "Mark as open" : "Mark as handled"}</button>
        </article>))}
    </div>
  );
}
