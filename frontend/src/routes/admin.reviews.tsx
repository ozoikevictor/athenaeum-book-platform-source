import { createFileRoute } from "@tanstack/react-router";
import { AdminReviewsPage } from "@/components/book-platform";
import { requireSignIn } from "@/lib/auth";
export const Route = createFileRoute("/admin/reviews")({ beforeLoad: requireSignIn, head: () => ({ meta: [{ title: "Reviews management — Athenaeum" }, { name: "description", content: "Review and moderate book ratings and reviews." }, { property: "og:title", content: "Reviews management — Athenaeum" }, { property: "og:description", content: "Review and moderate book ratings and reviews." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: AdminReviewsPage });
