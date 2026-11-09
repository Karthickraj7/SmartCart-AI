import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import Page from "../components/Page";
import ProductCard, { ProductCardSkeleton } from "../components/ProductCard";
import { api, errMsg } from "../services/api";

const SORTS = [["-created_at", "Default"], ["price", "Price: low to high"], ["-price", "Price: high to low"], ["name", "Name: A–Z"]];
const SIZES = [8, 12, 16, 24];

export default function Shop() {
  const [sp, setSp] = useSearchParams();
  const [filters, setFilters] = useState(false); const [view, setView] = useState("grid");
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const size = SIZES.includes(Number(sp.get("page_size"))) ? Number(sp.get("page_size")) : 16;
  const ordering = SORTS.some((s) => s[0] === sp.get("ordering")) ? sp.get("ordering") : "-created_at";
  const search = sp.get("search") || "", category = sp.get("category") || "", max = sp.get("max_price") || "";
  const set = (patch) => { const n = new URLSearchParams(sp); Object.entries({ page: "1", ...patch }).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k))); setSp(n); };

  const cats = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get("/categories/")).data });
  const { data, isLoading, error } = useQuery({
    queryKey: ["shop", search, category, ordering, max, page, size], placeholderData: (prev) => prev,
    queryFn: async () => (await api.get("/products/", { params: { search: search || undefined, category: category || undefined, ordering, max_price: max || undefined, page, page_size: size } })).data,
  });
  useEffect(() => { window.scrollTo?.({ top: 0 }); }, [page]);

  const count = data?.count ?? 0, pages = Math.max(1, Math.ceil(count / size));
  const from = count ? (page - 1) * size + 1 : 0, to = Math.min(page * size, count);
  const first = Math.max(1, Math.min(page - 1, pages - 2)), nums = Array.from({ length: Math.min(3, pages) }, (_, i) => first + i);
  const box = "h-12 border-0 bg-white px-4 text-base text-g9f md:h-[55px]";
  const pg = (active) => `flex h-12 min-w-12 items-center justify-center rounded-[10px] px-4 text-base md:h-[60px] md:min-w-[60px] md:text-xl ${active ? "bg-gold text-white" : "bg-peach text-black hover:bg-gold/30"}`;

  return (
    <Page title="Shop" crumbs={[{ label: "Shop" }]} strip>
      <div className="-mx-4 -mt-12 mb-12 bg-peach sm:-mx-6 md:-mt-16">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-8 gap-y-4 px-4 py-6 md:min-h-[100px] md:px-[98px]">
          <button onClick={() => setFilters((v) => !v)} aria-expanded={filters} className="flex items-center gap-3 text-xl"><SlidersHorizontal size={25} aria-hidden />Filter</button>
          <div className="flex items-center gap-4">
            <button onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={view === "grid" ? "text-black" : "text-g9f"}><LayoutGrid size={26} /></button>
            <button onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={view === "list" ? "text-black" : "text-g9f"}><List size={26} /></button>
          </div>
          <p className="border-l-2 border-g9f pl-8 text-base" aria-live="polite">{count ? `Showing ${from}–${to} of ${count} results` : "No results"}</p>
          <div className="ml-auto flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-4 text-xl">Show
              <select className={`${box} w-24`} value={size} onChange={(e) => set({ page_size: e.target.value })} aria-label="Products per page">{SIZES.map((n) => <option key={n}>{n}</option>)}</select></label>
            <label className="flex items-center gap-4 text-xl">Sort by
              <select className={`${box} w-48`} value={ordering} onChange={(e) => set({ ordering: e.target.value })} aria-label="Sort by">{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          </div>
        </div>
        {filters && (
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 pb-6 md:px-[98px]">
            {[{ slug: "", name: "All" }, ...(cats.data || [])].map((c) => (
              <button key={c.slug} onClick={() => set({ category: c.slug })} aria-pressed={category === c.slug} className={`rounded-full border px-4 py-1.5 text-sm ${category === c.slug ? "border-gold bg-gold text-white" : "border-g9f bg-white"}`}>{c.name}</button>))}
            <input type="number" min="0" value={max} onChange={(e) => set({ max_price: e.target.value })} placeholder="Max ₹" aria-label="Max price" className="h-10 w-28 rounded-full border border-g9f bg-white px-4 text-sm" />
            {(search || category || max) && <button onClick={() => setSp(new URLSearchParams())} className="text-sm underline">Clear all</button>}
            {search && <span className="text-sm text-g3">Searching “{search}”</span>}
          </div>)}
      </div>

      {error && <p role="alert" className="text-center text-accent-red">{errMsg(error)}</p>}
      {isLoading && <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}</div>}
      {data && data.results.length === 0 && <p className="py-10 text-center text-g3">No products found. <button className="underline" onClick={() => setSp(new URLSearchParams())}>Clear filters</button></p>}
      <div className={`grid gap-8 ${view === "grid" ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2"}`}>{data?.results.map((p) => <ProductCard key={p.id} p={p} />)}</div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-14 flex flex-wrap items-center justify-center gap-4 md:gap-9">
          {page > 1 && <button className={pg(false)} onClick={() => set({ page: String(page - 1) })}>Previous</button>}
          {nums.map((n) => <button key={n} className={pg(n === page)} aria-current={n === page ? "page" : undefined} onClick={() => set({ page: String(n) })}>{n}</button>)}
          {page < pages && <button className={pg(false)} onClick={() => set({ page: String(page + 1) })}>Next</button>}
        </nav>)}
    </Page>
  );
}
