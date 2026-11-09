import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Img from "./Img";
import { tpl } from "../brand";

// Page title banner from the template: blurred photo at 50% opacity, 48px title, breadcrumb underneath.
export default function PageBanner({ title, crumbs = [] }) {
  return (
    <section className="relative flex h-[200px] items-center justify-center overflow-hidden bg-cream text-center md:h-[316px]">
      <Img src={tpl("banner.jpg")} className="absolute inset-0 h-full w-full object-cover opacity-50 blur-[3px]" />
      <div className="relative px-4">
        <h1 className="text-3xl font-medium text-black md:text-5xl">{title}</h1>
        <nav aria-label="Breadcrumb" className="mt-3 flex items-center justify-center gap-1 text-base md:mt-5">
          <Link to="/" className="font-medium">Home</Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-1">
              <ChevronRight size={18} aria-hidden />
              {c.to ? <Link to={c.to} className="font-medium">{c.label}</Link> : <span className="font-light">{c.label}</span>}
            </span>
          ))}
        </nav>
      </div>
    </section>
  );
}
