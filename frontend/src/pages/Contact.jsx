import { useState } from "react";
import { Clock, MapPin, Phone } from "lucide-react";
import Page from "../components/Page";
import { api } from "../services/api";
import { SITE } from "../brand";

const EMPTY = { name: "", email: "", subject: "", message: "" };

export default function Contact() {
  const [f, setF] = useState(EMPTY); const [errors, setErrors] = useState({}); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setMsg(""); setErrors({}); setBusy(true);
    try { const { data } = await api.post("/contact/", f); setMsg(data.detail); setF(EMPTY); }
    catch (x) {
      const d = x.response?.data;
      if (x.response?.status === 429) setMsg("Too many messages. Please try again in a minute.");
      else if (d?.errors && typeof d.errors === "object" && !Array.isArray(d.errors)) setErrors(Object.fromEntries(Object.entries(d.errors).map(([k, v]) => [k, [].concat(v).join(" ")])));
      else setMsg("Could not send your message. Please try again.");
    } finally { setBusy(false); }
  };
  const field = (k, label, extra = {}) => (
    <div>
      <label className="label" htmlFor={`ct-${k}`}>{label}</label>
      {extra.area ? <textarea id={`ct-${k}`} className="field !h-[120px] py-4" value={f[k]} onChange={set(k)} placeholder={extra.ph} aria-invalid={!!errors[k]} />
        : <input id={`ct-${k}`} className="field" type={extra.type || "text"} value={f[k]} onChange={set(k)} placeholder={extra.ph} aria-invalid={!!errors[k]} />}
      {errors[k] && <p role="alert" className="mt-1 text-sm text-accent-red">{errors[k]}</p>}
    </div>
  );
  const info = (Icon, title, lines) => (
    <div className="flex gap-6"><Icon size={30} className="mt-1 shrink-0" aria-hidden /><div><h3 className="text-2xl font-medium">{title}</h3>{lines.map((l) => <p key={l} className="mt-1 max-w-[212px] text-base">{l}</p>)}</div></div>
  );
  return (
    <Page title="Contact" crumbs={[{ label: "Contact" }]} strip>
      <div className="mx-auto max-w-[644px] text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">Get In Touch With Us</h2>
        <p className="mt-4 text-base text-g9f">For more information about our products and services, please feel free to drop us an email. Our staff will always be there to help you out. Do not hesitate!</p>
      </div>
      <div className="mt-14 grid gap-12 lg:grid-cols-[393px_1fr] lg:gap-[30px]">
        <div className="space-y-12 lg:px-[56px] lg:pt-[56px]">
          {info(MapPin, "Address", [SITE.address])}{info(Phone, "Phone", SITE.phones)}{info(Clock, "Working Time", SITE.hours)}
        </div>
        <form onSubmit={submit} noValidate className="space-y-6 lg:px-[52px]">
          {field("name", "Your name", { ph: "Abc" })}{field("email", "Email address", { type: "email", ph: "Abc@def.com" })}
          {field("subject", "Subject", { ph: "This is optional" })}{field("message", "Message", { area: true, ph: "Hi! I'd like to ask about" })}
          {msg && <p role="status" className="text-accent-green">{msg}</p>}
          <button className="btn h-[55px] w-[237px]" disabled={busy}>{busy ? "Sending…" : "Submit"}</button>
        </form>
      </div>
    </Page>
  );
}
