import { createFileRoute } from "@tanstack/react-router";
import { AdminSavedBooksPage } from "@/components/book-platform";
import { requireSignIn } from "@/lib/auth";

export const Route = createFileRoute("/admin/saved-books")({
  beforeLoad: requireSignIn,
  head: () => ({
    meta: [
      { title: "Saved books — Athenaeum" },
      { name: "description", content: "View books saved by Athenaeum readers." },
      { property: "og:title", content: "Saved books — Athenaeum" },
      { property: "og:description", content: "View books saved by Athenaeum readers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ]
  }),
  component: AdminSavedBooksPage
});
