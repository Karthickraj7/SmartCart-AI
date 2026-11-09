import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const Ctx = createContext(null);
export const useUI = () => useContext(Ctx);
const MAX_COMPARE = 3;

function readCompare() {
  try { const v = JSON.parse(localStorage.getItem("compare") || "[]"); return Array.isArray(v) ? v.slice(0, MAX_COMPARE) : []; } catch { return []; }
}

export function UIProvider({ children }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [compare, setCompare] = useState(readCompare);
  const [toast, setToast] = useState("");
  const timer = useRef();
  useEffect(() => { try { localStorage.setItem("compare", JSON.stringify(compare)); } catch { /* storage unavailable */ } }, [compare]);
  const notify = useCallback((msg) => { setToast(msg); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(""), 2800); }, []);
  const toggleCompare = useCallback((id) => {
    setCompare((cur) => {
      if (cur.includes(id)) { notify("Removed from comparison"); return cur.filter((x) => x !== id); }
      if (cur.length >= MAX_COMPARE) { notify(`You can compare up to ${MAX_COMPARE} products`); return cur; }
      notify("Added to comparison"); return [...cur, id];
    });
  }, [notify]);
  return <Ctx.Provider value={{ cartOpen, setCartOpen, compare, toggleCompare, notify, toast }}>{children}</Ctx.Provider>;
}
