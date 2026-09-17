import { createFileRoute } from "@tanstack/react-router";
import { ReadingPage } from "@/components/book-platform";
import { requireReader } from "@/lib/auth";

export const Route = createFileRoute("/read/$bookId")({
  beforeLoad: requireReader,
  head: () => ({ meta: [{ title: "Read book - Athenaeum" }] }),
  component: () => <ReadingPage bookId={Route.useParams().bookId} />,
});
