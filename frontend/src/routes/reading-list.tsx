import { createFileRoute } from "@tanstack/react-router";
import { ReadingListPage } from "@/components/book-platform";
import { requireSignIn } from "@/lib/auth";
export const Route = createFileRoute("/reading-list")({ beforeLoad: requireSignIn, head: () => ({ meta: [{ title: "Reading list — Athenaeum" }, { name: "description", content: "Keep track of books you want to read, are reading, and have finished." }, { property: "og:title", content: "Reading list — Athenaeum" }, { property: "og:description", content: "Keep track of books you want to read, are reading, and have finished." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: ReadingListPage });
