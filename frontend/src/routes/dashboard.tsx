import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/book-platform";
import { requireSignIn } from "@/lib/auth";
export const Route = createFileRoute("/dashboard")({ beforeLoad: requireSignIn, head: () => ({ meta: [{ title: "Your reading pulse — Athenaeum" }, { name: "description", content: "See your reading activity and recommendations." }, { property: "og:title", content: "Your reading pulse — Athenaeum" }, { property: "og:description", content: "See your reading activity and recommendations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: DashboardPage });
