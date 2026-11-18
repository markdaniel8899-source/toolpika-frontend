/**
 * Instant loading state for admin dashboard navigation.
 *
 * Next.js shows this immediately on a route change while the Server Component
 * streams in. A light skeleton keeps navigation feeling instant instead of
 * freezing on the previous page while Supabase data loads.
 */
export default function AdminLoading() {
  return (
    <div className="tp-admin-page" aria-busy="true" aria-label="Loading">
      <div className="mb-8 flex flex-col gap-3">
        <div className="tp-skeleton tp-skeleton-line h-8 w-64" />
        <div className="tp-skeleton tp-skeleton-line w-80" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="tp-admin-card flex flex-col gap-3 p-5">
            <div className="tp-skeleton tp-skeleton-line w-24" />
            <div className="tp-skeleton tp-skeleton-line h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="tp-admin-card flex min-h-[280px] flex-col gap-4 p-6">
        <div className="tp-skeleton tp-skeleton-line w-40" />
        <div className="tp-skeleton tp-skeleton-line w-full" />
        <div className="tp-skeleton tp-skeleton-line w-11/12" />
        <div className="tp-skeleton tp-skeleton-line w-4/5" />
        <div className="tp-skeleton tp-skeleton-line w-full" />
      </div>
    </div>
  );
}
