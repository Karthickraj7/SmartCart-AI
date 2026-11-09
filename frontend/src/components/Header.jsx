import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Menu, Search, ShoppingCart, Sofa, User, X } from "lucide-react";
import Img from "./Img";
import { api } from "../services/api";
import { useAuth } from "../context/Auth";
import { useUI } from "../context/UI";
import { BRAND, tpl } from "../brand";

export default function Header() {
  const { authed, logout } = useAuth(); const { setCartOpen } = useUI(); const nav = useNavigate();
  const [menu, setMenu] = useState(false); const [account, setAccount] = useState(false); const [search, setSearch] = useState(false); const [q, setQ] = useState("");
  const cart = useQuery({ queryKey: ["cart"], enabled: authed, queryFn: async () => (await api.get("/cart/")).data });
  const notes = useQuery({ queryKey: ["notifications"], enabled: authed, refetchInterval: 60000, queryFn: async () => (await api.get("/notifications/")).data });
  const count = cart.data?.items.reduce((n, i) => n + i.quantity, 0) || 0;
  const unread = notes.data?.filter((n) => !n.is_read).length || 0;
  const link = ({ isActive }) => (isActive ? "text-gold" : "hover:text-gold");
  const go = (e) => { e.preventDefault(); setSearch(false); nav(`/shop?search=${encodeURIComponent(q.trim())}`); };
  const icon = "relative text-black hover:text-gold";
  return (
    <header className="sticky top-0 z-30 bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex h-[84px] max-w-[1440px] items-center justify-between px-4 md:h-[100px] md:px-[54px]">
        <Link to="/" className="flex items-center gap-1.5" aria-label={`${BRAND} home`}>
          <Img src={tpl("logo.png")} className="h-8 w-[50px] object-contain" />
          <Sofa size={30} className="text-gold" aria-hidden />
          <span className="font-logo text-[28px] font-bold md:text-[34px]">{BRAND}</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-10 text-base font-medium lg:flex xl:gap-[75px]">
          <NavLink to="/" end className={link}>Home</NavLink><NavLink to="/shop" className={link}>Shop</NavLink>
          <NavLink to="/info/about" className={link}>About</NavLink><NavLink to="/contact" className={link}>Contact</NavLink>
        </nav>
        <div className="flex items-center gap-5 md:gap-9">
          <div className="relative">
            {authed
              ? <button className={icon} onClick={() => setAccount((v) => !v)} aria-label="Account menu" aria-expanded={account}><User size={26} />{unread > 0 && <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-accent-red" />}</button>
              : <Link to="/login" className={icon} aria-label="Log in"><User size={26} /></Link>}
            {account && (
              <div className="absolute right-0 top-10 z-10 w-48 border bg-white py-2 text-sm shadow-lg" onClick={() => setAccount(false)}>
                <Link className="block px-4 py-2 hover:bg-peach" to="/account">My account</Link>
                <Link className="block px-4 py-2 hover:bg-peach" to="/orders">Orders</Link>
                <Link className="block px-4 py-2 hover:bg-peach" to="/notifications">Notifications{unread > 0 && ` (${unread})`}</Link>
                <button className="block w-full px-4 py-2 text-left hover:bg-peach" onClick={logout}>Log out</button>
              </div>)}
          </div>
          <button className={icon} onClick={() => setSearch((v) => !v)} aria-label="Search" aria-expanded={search}><Search size={26} /></button>
          <Link to="/wishlist" className={`${icon} hidden sm:block`} aria-label="Wishlist"><Heart size={26} /></Link>
          <button className={icon} onClick={() => setCartOpen(true)} aria-label={`Open cart${count ? `, ${count} items` : ""}`}>
            <ShoppingCart size={26} />{count > 0 && <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] text-white">{count}</span>}
          </button>
          <button className="lg:hidden" onClick={() => setMenu((v) => !v)} aria-label="Menu" aria-expanded={menu}>{menu ? <X size={26} /> : <Menu size={26} />}</button>
        </div>
      </div>
      {search && (
        <form onSubmit={go} className="border-t bg-white px-4 py-3 md:px-[54px]" role="search">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search furniture…" aria-label="Search products" className="input max-w-xl" />
        </form>)}
      {menu && (
        <nav aria-label="Mobile" className="flex flex-col gap-4 border-t bg-white px-6 py-5 text-base font-medium lg:hidden" onClick={() => setMenu(false)}>
          <Link to="/">Home</Link><Link to="/shop">Shop</Link><Link to="/info/about">About</Link><Link to="/contact">Contact</Link><Link to="/wishlist">Wishlist</Link>
        </nav>)}
    </header>
  );
}
