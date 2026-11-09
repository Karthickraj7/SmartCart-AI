import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errMsg } from "../services/api";
import { BRAND, SITE } from "../brand";

export default function Footer() {
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState(""); const [bad, setBad] = useState(false);
  const subscribe = async (e) => {
    e.preventDefault(); setMsg(""); setBad(false);
    try { const { data } = await api.post("/newsletter/", { email }); setMsg(data.detail); setEmail(""); }
    catch (x) { setBad(true); setMsg(errMsg(x)); }
  };
  const col = "flex flex-col gap-6 text-base font-medium";
  return (
    <footer className="border-t border-black/[0.17] bg-white">
      <div className="mx-auto max-w-[1440px] px-6 pt-12 md:px-[100px] md:pt-[48px]">
        <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
          <div>
            <p className="mb-8 text-2xl font-bold">{BRAND}.</p>
            <p className="max-w-[220px] text-base text-g9f">{SITE.footerAddress}</p>
          </div>
          <nav aria-label="Footer links" className={col}>
            <p className="text-g9f">Links</p>
            <Link to="/">Home</Link><Link to="/shop">Shop</Link><Link to="/info/about">About</Link><Link to="/contact">Contact</Link>
          </nav>
          <nav aria-label="Help" className={col}>
            <p className="text-g9f">Help</p>
            <Link to="/info/faq">Payment Options</Link><Link to="/info/returns">Returns</Link><Link to="/info/privacy">Privacy Policies</Link>
          </nav>
          <div>
            <p className="mb-6 text-base font-medium text-g9f">Newsletter</p>
            <form onSubmit={subscribe} className="flex items-end gap-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter Your Email Address" aria-label="Email address"
                className="min-w-0 flex-1 border-b border-black bg-transparent pb-1 text-sm outline-none placeholder:text-g9f" />
              <button className="border-b border-black pb-1 text-sm font-medium">SUBSCRIBE</button>
            </form>
            {msg && <p role={bad ? "alert" : "status"} className={`mt-3 text-sm ${bad ? "text-accent-red" : "text-accent-green"}`}>{msg}</p>}
          </div>
        </div>
        <div className="border-t border-g5 py-8 text-base">© {new Date().getFullYear()} {BRAND}. All rights reserved.</div>
      </div>
    </footer>
  );
}
