import { createFileRoute } from "@tanstack/react-router";
import { AdminBooksPage } from "@/components/book-platform";
import { requireSignIn } from "@/lib/auth";
export const Route = createFileRoute("/admin/books")({ beforeLoad: requireSignIn, head: () => ({ meta: [{ title: "Book management — Athenaeum" }, { name: "description", content: "Add, edit, and manage Athenaeum books." }, { property: "og:title", content: "Book management — Athenaeum" }, { property: "og:description", content: "Add, edit, and manage Athenaeum books." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: AdminBooksPage });
