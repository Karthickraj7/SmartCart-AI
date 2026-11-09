import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errMsg } from "../services/api";

const ROLES = ["customer", "support_agent", "order_manager", "product_manager", "super_admin"];
export default function Team() {
  const qc = useQueryClient(); const [msg, setMsg] = useState("");
  const users = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get("/admin/users/")).data });
  const audit = useQuery({ queryKey: ["audit"], queryFn: async () => (await api.get("/admin/audit/")).data });
  const setRole = useMutation({ mutationFn: ({ id, role }) => api.post(`/admin/users/${id}/role/`, { role }),
    onSuccess: () => { setMsg(""); qc.invalidateQueries({ queryKey: ["users"] }); qc.invalidateQueries({ queryKey: ["audit"] }); }, onError: (e) => setMsg(errMsg(e)) });
  if (users.error) return <p role="alert">{errMsg(users.error)} (Super Admin only)</p>;
  return (
    <div className="space-y-6">
      {msg && <p role="alert" className="text-red-600">{msg}</p>}
      <section><h2 className="mb-2 font-medium">Users & roles</h2>
        <table className="w-full min-w-[480px] text-left text-sm"><thead><tr><th>Email</th><th>Role</th></tr></thead>
          <tbody>{users.data?.map((u) => <tr key={u.id} className="border-t"><td>{u.email}</td>
            <td><select className="input w-auto py-1" value={u.role} onChange={(e) => setRole.mutate({ id: u.id, role: e.target.value })} aria-label={`Role for ${u.email}`}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></td></tr>)}</tbody></table></section>
      <section><h2 className="mb-2 font-medium">Audit log</h2>
        {audit.data?.map((a, i) => <p key={i} className="text-sm text-stone-600">{new Date(a.created_at).toLocaleString()} · {a.user__email || "system"} · {a.action} {a.target}</p>)}</section>
    </div>
  );
}
