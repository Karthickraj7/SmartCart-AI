import { useState } from "react";
import { api, errMsg } from "../services/api";
export default function Login({ onDone }) {
  const [f, setF] = useState({ email: "", password: "" }); const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try { const { data } = await api.post("/auth/login/", f); localStorage.setItem("access", data.access); localStorage.setItem("refresh", data.refresh); onDone(); }
    catch (x) { setErr(errMsg(x)); }
  };
  return (
    <form onSubmit={submit} className="mx-auto mt-24 max-w-sm space-y-3 px-4">
      <h1 className="font-display text-2xl">Admin sign in</h1>
      <input className="input" type="email" placeholder="Email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className="input" type="password" placeholder="Password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <p role="alert" className="text-red-600">{err}</p>}
      <button className="btn w-full">Sign in</button>
    </form>
  );
}
