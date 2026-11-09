import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";
import { useAuth } from "../context/Auth";

export default function Notifications() {
  const { authed } = useAuth(); const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["notifications"], enabled: authed, queryFn: async () => (await api.get("/notifications/")).data });
  const readAll = useMutation({ mutationFn: () => api.post("/notifications/"), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
  if (!authed) return <p><Link className="underline" to="/login">Log in</Link> to see notifications.</p>;
  if (isLoading) return <p className="animate-pulse">Loading…</p>;
  if (error) return <p role="alert">{errMsg(error)}</p>;
  return (
    <>
      <div className="mb-3 flex justify-between"><h1 className="text-2xl font-medium">Notifications</h1><button className="text-sm underline" onClick={() => readAll.mutate()}>Mark all read</button></div>
      {data.length === 0 && <p>Nothing yet.</p>}
      {data.map((n) => <p key={n.id} className={`border-b py-2 text-sm ${n.is_read ? "text-stone-500" : "font-medium"}`}>{n.message}</p>)}
    </>
  );
}
