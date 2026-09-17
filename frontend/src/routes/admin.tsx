import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/auth";

export const Route = createFileRoute("/admin")({ beforeLoad: requireAdmin, head: () => ({ meta: [{ title: "Admin studio — Athenaeum" }, { name: "description", content: "Manage the Athenaeum book recommendation platform." }, { property: "og:title", content: "Admin studio — Athenaeum" }, { property: "og:description", content: "Manage the Athenaeum book recommendation platform." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Outlet });
