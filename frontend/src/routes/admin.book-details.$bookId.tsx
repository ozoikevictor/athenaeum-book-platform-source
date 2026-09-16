import { createFileRoute } from "@tanstack/react-router";
import { AdminBookDetailsPage } from "@/components/book-platform";
import { requireSignIn } from "@/lib/auth";

export const Route = createFileRoute("/admin/book-details/$bookId")({
  beforeLoad: requireSignIn,
  head: ({ params }) => ({
    meta: [
      { title: `${params.bookId.replaceAll("-", " ")} — Admin book view` },
      { name: "description", content: "Inspect a book from the admin side." },
      { property: "og:title", content: "Admin book view — Athenaeum" },
      { property: "og:description", content: "Inspect a book from the admin side." },
      { property: "og:type", content: "book" },
      { name: "twitter:card", content: "summary" }
    ]
  }),
  component: () => <AdminBookDetailsPage bookId={Route.useParams().bookId} />
});
