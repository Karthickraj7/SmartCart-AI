import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, errMsg } from "../services/api";

export default function Reset() {
  const [sp] = useSearchParams(); const uid = sp.get("uid"), token = sp.get("token");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [msg, setMsg] = useState(""); const [bad, setBad] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBad(false);
    try {
      const { data } = uid ? await api.post("/auth/password-reset/confirm/", { uid, token, password }) : await api.post("/auth/password-reset/", { email });
      setMsg(data.detail);
    } catch (x) { setBad(true); setMsg(errMsg(x)); }
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3">
      <h1 className="text-2xl font-medium">{uid ? "Choose a new password" : "Forgot password"}</h1>
      {uid ? <input className="input" type="password" placeholder="New password" required value={password} onChange={(e) => setPassword(e.target.value)} />
           : <input className="input" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
      {msg && <p role={bad ? "alert" : "status"} className={bad ? "text-red-600" : "text-gold"}>{msg}</p>}
      <button className="btn w-full">{uid ? "Update password" : "Send reset link"}</button>
    </form>
  );
}
