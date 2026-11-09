import { Headphones, ShieldCheck, Trophy, Truck } from "lucide-react";
import { FEATURES } from "../brand";

const ICONS = { trophy: Trophy, shield: ShieldCheck, truck: Truck, support: Headphones };

export default function FeatureStrip() {
  return (
    <section className="bg-strip py-14 md:py-[100px]" aria-label="Our promises">
      <div className="mx-auto grid max-w-[1334px] gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => {
          const Icon = ICONS[f.icon];
          return (
            <div key={f.title} className="flex items-center gap-3">
              <Icon size={52} strokeWidth={1.4} className="shrink-0" aria-hidden />
              <div className="leading-normal">
                <p className="text-xl font-semibold text-[#242424] xl:text-[25px]">{f.title}</p>
                <p className="text-base font-medium text-g3 xl:text-xl">{f.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
