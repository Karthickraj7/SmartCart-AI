import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Page from "../components/Page";
import { api } from "../services/api";

// Shown until the owner publishes real text from Admin > Site pages. Replace before launch.
const DEFAULTS = {
  about: ["About us", "Welcome! Our story will appear here once it is published from the admin dashboard."],
  contact: ["Contact", "Contact details will appear here once published from the admin dashboard."],
  faq: ["FAQ", "Orders ship within 2 business days and arrive in 3–7 days. Ask the shopping assistant (bottom-right) for anything else."],
  privacy: ["Privacy Policy", "Our privacy policy has not been published yet."],
  terms: ["Terms and Conditions", "Our terms have not been published yet."],
  returns: ["Return and Refund Policy", "Our return and refund policy has not been published yet."],
};
export default function Info() {
  const slug = useParams().slug;
  const { data, isLoading } = useQuery({ queryKey: ["page", slug], retry: false, queryFn: async () => (await api.get(`/pages/${slug}/`)).data });
  if (isLoading) return <Page title="…"><p className="animate-pulse">Loading…</p></Page>;
  const [title, body] = data ? [data.title, data.body] : DEFAULTS[slug] || ["Not found", "This page does not exist."];
  return <Page title={title} crumbs={[{ label: title }]}><article className="mx-auto max-w-2xl"><p className="whitespace-pre-wrap text-g2">{body}</p></article></Page>;
}
