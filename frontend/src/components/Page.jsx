import PageBanner from "./PageBanner";
import FeatureStrip from "./FeatureStrip";

// Standard inner-page shell: template banner + content container (+ optional feature strip).
export default function Page({ title, crumbs, strip = false, children, narrow = false }) {
  return (
    <>
      <PageBanner title={title} crumbs={crumbs} />
      <div className={`container-page py-12 md:py-16 ${narrow ? "max-w-[640px]" : ""}`}>{children}</div>
      {strip && <FeatureStrip />}
    </>
  );
}
