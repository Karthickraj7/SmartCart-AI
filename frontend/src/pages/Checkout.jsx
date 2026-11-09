import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Page from "../components/Page";
import { api, errMsg } from "../services/api";
import { startPayment } from "../services/payment";
import { useAuth } from "../context/Auth";

const EMPTY = { first_name: "", last_name: "", company: "", line1: "", city: "", state: "", pincode: "", phone: "", notes: "" };
const STATES = ["Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

export default function Checkout() {
  const { authed } = useAuth(); const nav = useNavigate(); const qc = useQueryClient();
  const [f, setF] = useState(EMPTY); const [coupon, setCoupon] = useState(""); const [applied, setApplied] = useState("");
  const [errors, setErrors] = useState({}); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const me = useQuery({ queryKey: ["me"], enabled: authed, queryFn: async () => (await api.get("/auth/me/")).data });
  const saved = useQuery({ queryKey: ["addresses"], enabled: authed, queryFn: async () => (await api.get("/auth/addresses/")).data });
  const cart = useQuery({ queryKey: ["cart", applied], enabled: authed, queryFn: async () => (await api.get("/cart/", { params: { coupon: applied || undefined } })).data });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (!authed) return <Page title="Checkout" crumbs={[{ label: "Checkout" }]}><p><Link className="underline" to="/login">Log in</Link> to check out.</p></Page>;
  if (cart.isLoading) return <Page title="Checkout" crumbs={[{ label: "Checkout" }]}><p className="animate-pulse">Loading…</p></Page>;
  const c = cart.data;
  if (!c?.items.length) return <Page title="Checkout" crumbs={[{ label: "Checkout" }]}><p>Your cart is empty. <Link to="/shop" className="underline">Continue shopping</Link></p></Page>;

  const prefill = (id) => {
    const a = saved.data?.results.find((x) => String(x.id) === id); if (!a) return;
    const [first, ...rest] = a.name.split(" ");
    setF({ ...f, first_name: first, last_name: rest.join(" "), line1: a.line1, city: a.city, state: a.state, pincode: a.pincode, phone: a.phone });
  };
  const validate = () => {
    const e = {};
    if (!f.first_name.trim()) e.first_name = "Required"; if (!f.last_name.trim()) e.last_name = "Required";
    if (!f.line1.trim()) e.line1 = "Required"; if (!f.city.trim()) e.city = "Required"; if (!f.state.trim()) e.state = "Required";
    if (!/^\d{6}$/.test(f.pincode.trim())) e.pincode = "Enter a 6-digit PIN code";
    if (!/^[+\d][\d\s-]{6,}$/.test(f.phone.trim())) e.phone = "Enter a valid phone number";
    setErrors(e); return Object.keys(e).length === 0;
  };
  const placeOrder = async (e) => {
    e.preventDefault(); setMsg("");
    if (!validate()) return;
    setBusy(true); let orderId = null;
    try {
      const { data: order } = await api.post("/orders/", { coupon_code: applied || undefined, address: {
        name: `${f.first_name.trim()} ${f.last_name.trim()}`, line1: f.line1.trim(), city: f.city.trim(), state: f.state.trim(), pincode: f.pincode.trim(), phone: f.phone.trim(),
        company: f.company.trim(), notes: f.notes.trim(), country: "India" } });
      orderId = order.id;
      qc.invalidateQueries({ queryKey: ["cart"] });
      await startPayment(order.id, {
        prefill: { name: `${f.first_name} ${f.last_name}`, email: me.data?.email, contact: f.phone },
        onSuccess: () => nav("/payment/success"), onFailure: () => nav("/payment/failed"),
      });
    } catch (x) {
      setMsg(orderId ? `Your order #${orderId} was saved but payment could not start: ${errMsg(x)} You can pay from My Orders.` : errMsg(x));
    } finally { setBusy(false); }
  };
  const field = (k, label, props = {}) => (
    <div className={props.wrap}>
      <label className="label" htmlFor={`co-${k}`}>{label}</label>
      <input id={`co-${k}`} className="field" value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `co-${k}-err` : undefined} {...props.input} />
      {errors[k] && <p id={`co-${k}-err`} className="mt-1 text-sm text-accent-red">{errors[k]}</p>}
    </div>
  );
  return (
    <Page title="Checkout" crumbs={[{ label: "Checkout" }]} strip>
      <form onSubmit={placeOrder} noValidate className="grid gap-10 lg:grid-cols-2 lg:gap-[26px]">
        <section className="space-y-6 lg:px-[75px] lg:pt-[35px]" aria-label="Billing details">
          <h2 className="text-3xl font-semibold md:text-4xl">Billing details</h2>
          {saved.data?.results.length > 0 && (
            <div><label className="label" htmlFor="co-saved">Use a saved address</label>
              <select id="co-saved" className="field" defaultValue="" onChange={(e) => prefill(e.target.value)}><option value="">Choose…</option>{saved.data.results.map((a) => <option key={a.id} value={a.id}>{a.name}, {a.city}</option>)}</select></div>)}
          <div className="grid gap-6 sm:grid-cols-2">{field("first_name", "First Name")}{field("last_name", "Last Name")}</div>
          {field("company", "Company Name (Optional)")}
          <div><label className="label" htmlFor="co-country">Country / Region</label><select id="co-country" className="field" disabled><option>India</option></select></div>
          {field("line1", "Street address", { input: { autoComplete: "street-address" } })}
          {field("city", "Town / City")}
          <div><label className="label" htmlFor="co-state">State</label>
            <input id="co-state" list="states" className="field" value={f.state} onChange={set("state")} aria-invalid={!!errors.state} /><datalist id="states">{STATES.map((s) => <option key={s} value={s} />)}</datalist>
            {errors.state && <p className="mt-1 text-sm text-accent-red">{errors.state}</p>}</div>
          {field("pincode", "PIN code", { input: { inputMode: "numeric", maxLength: 6 } })}
          {field("phone", "Phone", { input: { type: "tel" } })}
          <div><label className="label" htmlFor="co-email">Email address</label><input id="co-email" className="field bg-light" value={me.data?.email || ""} readOnly /><p className="mt-1 text-sm text-g3">From your account. Order updates are sent to your notifications.</p></div>
          <div><label className="label" htmlFor="co-notes">Additional information</label><textarea id="co-notes" className="field !h-28 py-4" maxLength={500} value={f.notes} onChange={set("notes")} placeholder="Notes about your order, e.g. delivery instructions" /></div>
        </section>

        <section className="lg:px-[38px] lg:pt-[87px]" aria-label="Order summary">
          <div className="flex justify-between text-xl font-medium md:text-2xl"><span>Product</span><span>Subtotal</span></div>
          <ul className="mt-6 space-y-4 text-base">
            {c.items.map((i) => <li key={i.id} className="flex justify-between gap-4"><span className="text-g9f">{i.name}{i.variant ? ` (${i.variant})` : ""} <span className="text-xs font-medium text-black">× {i.quantity}</span></span><span className="font-light">₹{i.line_total}</span></li>)}
          </ul>
          <dl className="mt-6 space-y-4 text-base">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-light">₹{c.subtotal}</dd></div>
            {Number(c.discount) > 0 && <div className="flex justify-between text-accent-green"><dt>Discount ({applied})</dt><dd>−₹{c.discount}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd className="font-light">{Number(c.delivery_fee) ? `₹${c.delivery_fee}` : "Free"}</dd></div>
            <div className="flex justify-between"><dt>Tax</dt><dd className="font-light">₹{c.tax}</dd></div>
            <div className="flex items-center justify-between"><dt>Total</dt><dd className="text-2xl font-bold text-gold">₹{c.total}</dd></div>
          </dl>
          <div className="mt-6 flex gap-3">
            <input className="input" placeholder="Coupon code" aria-label="Coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
            <button type="button" className="btn-outline-gold !px-6" onClick={() => setApplied(coupon.trim())}>Apply</button>
          </div>
          {c.coupon_error && <p role="alert" className="mt-2 text-sm text-accent-red">{c.coupon_error}</p>}
          <hr className="my-8 border-g5" />
          <fieldset>
            <legend className="sr-only">Payment method</legend>
            <label className="flex items-center gap-3 text-base"><input type="radio" checked readOnly className="accent-black" /> Pay online with Razorpay</label>
            <p className="mt-3 text-justify text-base font-light text-g9f">Pay securely by UPI, card or net banking. Your order is confirmed only after the payment is verified by our server.</p>
          </fieldset>
          <p className="mt-8 text-justify text-base font-light">Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our <Link to="/info/privacy" className="font-semibold">privacy policy.</Link></p>
          {msg && <p role="alert" className="mt-4 text-accent-red">{msg}</p>}
          <div className="mt-8 text-center"><button className="btn-black w-full max-w-[318px] !h-16" disabled={busy}>{busy ? "Processing…" : "Place order"}</button></div>
        </section>
      </form>
    </Page>
  );
}
