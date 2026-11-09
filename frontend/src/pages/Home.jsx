import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight } from "lucide-react";
import Img from "../components/Img";
import ProductCard, { ProductCardSkeleton } from "../components/ProductCard";
import { api, errMsg } from "../services/api";
import { BRAND, tpl } from "../brand";

const SLIDES = [
  { room: "Bed Room", title: "Inner Peace", img: "inspiration-1.jpg" },
  { room: "Living Room", title: "Warm Gathering", img: "inspiration-2.jpg" },
  { room: "Dining Room", title: "Shared Meals", img: "inspiration-3.jpg" },
];
const RANGE_IMG = ["range-dining.jpg", "range-living.jpg", "range-bedroom.jpg"];
const SHARE = ["h-[312px]", "h-[382px]", "h-[312px]", "h-[392px]", "h-[242px]", "h-[242px]", "h-[196px]", "h-[348px]", "h-[433px]", "h-[323px]"];

function useImageExists(src) {
  const [ok, setOk] = useState(false);
  useEffect(() => { const i = new Image(); i.onload = () => setOk(true); i.src = src; }, [src]);
  return ok;
}

export default function Home() {
  const [slide, setSlide] = useState(0);
  const cats = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get("/categories/")).data });
  const prods = useQuery({ queryKey: ["home-products"], queryFn: async () => (await api.get("/products/", { params: { page_size: 8, ordering: "-created_at" } })).data });
  const showShare = useImageExists(tpl("share-1.jpg"));
  const range = (cats.data || []).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[520px] items-center bg-peach md:min-h-[717px]">
        <Img src={tpl("hero.jpg")} className="absolute inset-0 h-full w-full object-cover" />
        <div className="container-page relative flex justify-end py-12 md:max-w-[1440px] md:px-[58px]">
          <div className="w-full rounded-[10px] bg-cream p-6 md:w-[643px] md:p-[62px]">
            <p className="text-base font-semibold tracking-[3px] text-ink">New Arrival</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-gold md:text-[52px] md:leading-[65px]">Discover Our New Collection</h2>
            <p className="mb-8 mt-4 text-base font-medium text-ink md:text-lg">Handcrafted furniture for every room. Free delivery on orders over ₹999.</p>
            <Link to="/shop" className="inline-block bg-gold px-12 py-5 text-base font-bold uppercase text-white hover:bg-gold-dark md:px-[72px] md:py-[25px]">Buy now</Link>
          </div>
        </div>
      </section>

      {/* Browse the range */}
      {range.length > 0 && (
        <section className="container-page py-14 md:py-[56px]">
          <h2 className="text-center text-2xl font-bold text-ink md:text-[32px]">Browse The Range</h2>
          <p className="mt-2 text-center text-lg text-ink2 md:text-xl">Find the right piece for every room.</p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {range.map((c, i) => (
              <Link key={c.id} to={`/shop?category=${c.slug}`} className="group text-center">
                <Img src={tpl(RANGE_IMG[i])} alt={c.name} className="aspect-[381/480] w-full rounded-[20px] bg-peach object-cover transition group-hover:opacity-90" />
                <p className="mt-7 text-2xl font-semibold text-ink">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Our products */}
      <section className="container-page pb-14 pt-6 md:pb-[69px]">
        <h2 className="mb-8 text-center text-3xl font-bold text-g1 md:text-[40px]">Our Products</h2>
        {prods.error && <p role="alert" className="text-center text-accent-red">{errMsg(prods.error)}</p>}
        {prods.isLoading && <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}</div>}
        {prods.data?.results.length === 0 && <p className="text-center text-g3">No products yet. Check back soon.</p>}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{prods.data?.results.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        <div className="mt-8 text-center"><Link to="/shop" className="btn-outline-gold w-[245px]">Show More</Link></div>
      </section>

      {/* Inspirations */}
      <section className="overflow-hidden bg-inspo py-12 md:h-[670px] md:py-0">
        <div className="mx-auto flex h-full max-w-[1440px] flex-col gap-10 px-6 md:flex-row md:items-center md:px-[100px]">
          <div className="md:w-[422px] md:shrink-0">
            <h2 className="text-3xl font-bold leading-tight text-g1 md:text-[40px]">Beautiful rooms to inspire you</h2>
            <p className="mb-8 mt-3 text-base font-medium text-g2">Ideas from our designers to help you picture your space.</p>
            <Link to="/shop" className="btn !rounded-none">Explore More</Link>
          </div>
          <div className="relative flex flex-1 items-center gap-6" aria-roledescription="carousel">
            {SLIDES.map((s, i) => {
              const active = i === slide;
              return (
                <div key={s.room} className={`${active ? "block" : "hidden md:block"} relative shrink-0 ${active ? "w-full md:w-[404px]" : "md:w-[372px]"}`} aria-hidden={!active}>
                  <Img src={tpl(s.img)} alt={s.room} className={`w-full bg-peach object-cover ${active ? "h-[420px] md:h-[582px]" : "h-[486px]"}`} />
                  {active && (
                    <>
                      <div className="absolute bottom-6 left-6 bg-white/70 p-8 backdrop-blur-[1.5px]">
                        <p className="flex items-center gap-2 text-base font-medium text-g2">0{i + 1}<span className="h-px w-7 bg-g2" />{s.room}</p>
                        <p className="mt-1 text-[28px] font-semibold leading-tight text-g1">{s.title}</p>
                      </div>
                      <Link to="/shop" aria-label={`Shop ${s.room}`} className="absolute bottom-0 right-0 flex h-12 w-12 items-center justify-center bg-gold text-white"><ArrowRight size={22} /></Link>
                    </>)}
                </div>);
            })}
            <button onClick={() => setSlide((slide + 1) % SLIDES.length)} aria-label="Next slide" className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gold shadow-md"><ChevronRight /></button>
            <div className="absolute -bottom-9 left-0 flex items-center gap-4 md:bottom-[-30px]">
              {SLIDES.map((s, i) => <button key={s.room} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} aria-current={i === slide} className={`rounded-full ${i === slide ? "h-3 w-3 bg-gold ring-4 ring-gold/30" : "h-[11px] w-[11px] bg-g4"}`} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Share your setup (hidden until the template photos are added) */}
      {showShare && (
        <section className="overflow-hidden py-14 md:py-[59px]">
          <p className="text-center text-xl font-semibold text-g2">Share your setup with</p>
          <h2 className="mb-10 text-center text-3xl font-bold text-g1 md:text-[40px]">#{BRAND}Furniture</h2>
          <div className="columns-2 gap-4 px-4 md:columns-5">
            {SHARE.map((h, i) => <Img key={i} src={tpl(`share-${i + 1}.jpg`)} className={`mb-4 w-full bg-g5 object-cover ${h}`} />)}
          </div>
        </section>)}
    </>
  );
}
