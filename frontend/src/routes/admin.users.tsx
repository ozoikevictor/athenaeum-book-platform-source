import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersPage } from "@/components/book-platform";
import { requireSignIn } from "@/lib/auth";
export const Route = createFileRoute("/admin/users")({ beforeLoad: requireSignIn, head: () => ({ meta: [{ title: "User management — Athenaeum" }, { name: "description", content: "Manage reader accounts and roles." }, { property: "og:title", content: "User management — Athenaeum" }, { property: "og:description", content: "Manage reader accounts and roles." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: AdminUsersPage });
