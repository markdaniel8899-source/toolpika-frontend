import Link from "next/link";
import "@/app/globals.css";

// Rendered for requests that never reach the [locale] segment.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 font-sans text-[var(--text)]">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            404
          </p>
          <h1 className="mt-3 font-sans text-3xl tracking-display">
            Page not found
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            This page does not exist or was moved.
          </p>
          <Link
            href="/en"
            className="mt-7 inline-flex rounded-[10px] bg-[var(--accent-fill)] px-6 py-3 font-bold text-[var(--on-accent)] transition-all duration-200 hover:bg-[var(--accent-fill-hover)]"
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
