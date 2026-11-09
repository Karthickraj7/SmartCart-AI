import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, errMsg } from "../services/api";
import { useAuth } from "../context/Auth";

export default function Login() {
  const { login } = useAuth(); const nav = useNavigate();
  const [mode, setMode] = useState("login"); const [f, setF] = useState({ email: "", password: "" }); const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      if (mode === "register") await api.post("/auth/register/", f);
      await login(f.email, f.password); nav("/");
    } catch (x) { setErr(errMsg(x)); }
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3">
      <h1 className="text-2xl font-medium">{mode === "login" ? "Welcome back" : "Create account"}</h1>
      <input className="input" type="email" placeholder="Email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className="input" type="password" placeholder="Password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <p role="alert" className="text-red-600">{err}</p>}
      <button className="btn w-full">{mode === "login" ? "Log in" : "Register"}</button>
      <button type="button" className="text-sm underline" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Need an account?" : "Have an account?"}</button>
      <Link to="/reset" className="block text-sm underline">Forgot password?</Link>
    </form>
  );
}
