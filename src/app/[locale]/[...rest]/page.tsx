import { notFound } from "next/navigation";

// Any unknown route inside a locale segment renders the localized 404 page.
export default function CatchAllPage() {
  notFound();
}
