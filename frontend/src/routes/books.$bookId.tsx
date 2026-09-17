import { createFileRoute } from "@tanstack/react-router";
import { BookDetailsPage } from "@/components/book-platform";
import { requireReader } from "@/lib/auth";
export const Route = createFileRoute("/books/$bookId")({ beforeLoad: requireReader, head: ({ params }) => ({ meta: [{ title: `${params.bookId.replaceAll("-", " ")} — Athenaeum` }, { name: "description", content: "Book details, ratings, and similar recommendations." }, { property: "og:title", content: "Book details — Athenaeum" }, { property: "og:description", content: "Book details, ratings, and similar recommendations." }, { property: "og:type", content: "book" }, { name: "twitter:card", content: "summary" }] }), component: () => <BookDetailsPage bookId={Route.useParams().bookId} /> });
