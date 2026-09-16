import { createFileRoute } from "@tanstack/react-router";
import { BrowsePage } from "@/components/book-platform";
import { requireSignIn } from "@/lib/auth";
export const Route = createFileRoute("/browse")({ beforeLoad: requireSignIn, head: () => ({ meta: [{ title: "Browse books — Athenaeum" }, { name: "description", content: "Search books by genre, rating, and recommendation." }, { property: "og:title", content: "Browse books — Athenaeum" }, { property: "og:description", content: "Search books by genre, rating, and recommendation." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: BrowsePage });
