import { createFileRoute } from "@tanstack/react-router";
import { AdminOverviewPage } from "@/components/book-platform";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview — Athenaeum" },
      { name: "description", content: "See platform totals, activity, and recommendation health." },
      { property: "og:title", content: "Admin overview — Athenaeum" },
      { property: "og:description", content: "See platform totals, activity, and recommendation health." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ]
  }),
  component: AdminOverviewPage
});
