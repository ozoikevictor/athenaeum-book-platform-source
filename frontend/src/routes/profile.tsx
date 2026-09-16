import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/book-platform";
import { requireSignIn } from "@/lib/auth";
export const Route = createFileRoute("/profile")({ beforeLoad: requireSignIn, head: () => ({ meta: [{ title: "Profile — Athenaeum" }, { name: "description", content: "Manage your reader profile and recommendation preferences." }, { property: "og:title", content: "Profile — Athenaeum" }, { property: "og:description", content: "Manage your reader profile and recommendation preferences." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: ProfilePage });
