import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/book-platform";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Athenaeum — Find your next favorite book" },
    { name: "description", content: "Discover thoughtful book recommendations shaped by your reading life." },
    { property: "og:title", content: "Athenaeum — Find your next favorite book" },
    { property: "og:description", content: "Discover thoughtful book recommendations shaped by your reading life." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: LandingPage,
});