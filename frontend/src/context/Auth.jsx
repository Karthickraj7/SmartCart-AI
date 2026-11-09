import { createContext, useContext, useState } from "react";
import { api } from "../services/api";
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(!!localStorage.getItem("access"));
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login/", { email, password });
    localStorage.setItem("access", data.access); localStorage.setItem("refresh", data.refresh); setAuthed(true);
  };
  const logout = () => { localStorage.clear(); setAuthed(false); };
  return <Ctx.Provider value={{ authed, login, logout }}>{children}</Ctx.Provider>;
}
