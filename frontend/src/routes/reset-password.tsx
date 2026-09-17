import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/components/book-platform";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password - Athenaeum" }] }),
  component: ResetPasswordPage,
});
