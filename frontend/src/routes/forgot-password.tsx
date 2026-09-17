import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/components/book-platform";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password - Athenaeum" }] }),
  component: ForgotPasswordPage,
});
