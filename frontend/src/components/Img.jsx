import { useEffect, useState } from "react";

// Image with a graceful fallback: if the file is missing or fails to load, a tinted block of the same size is shown.
export default function Img({ src, alt = "", className = "", ...rest }) {
  const [bad, setBad] = useState(!src);
  useEffect(() => setBad(!src), [src]);
  if (bad) return <div role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} className={className} />;
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={className} {...rest} />;
}
