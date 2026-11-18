export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`tp-skeleton ${className}`} aria-hidden="true" />;
}

export function CarouselSkeleton() {
  return (
    <div className="tp-carousel tp-skeleton" style={{ padding: 20 }} aria-hidden="true">
      <div className="tp-skeleton-line" style={{ width: 96, marginBottom: 24 }} />
      <div className="tp-skeleton-line" style={{ width: "55%", height: 22, marginBottom: 12 }} />
      <div className="tp-skeleton-line" style={{ width: "85%", marginBottom: 8 }} />
      <div className="tp-skeleton-line" style={{ width: "65%", marginBottom: 20 }} />
      <div className="tp-skeleton" style={{ height: 118, borderRadius: 12 }} />
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="tp-workspace" aria-hidden="true">
      <div className="tp-workspace-pane">
        <div className="tp-skeleton-line" style={{ width: 80, marginBottom: 18 }} />
        <div className="tp-skeleton" style={{ minHeight: 292, borderRadius: 10 }} />
      </div>
      <div className="tp-workspace-pane">
        <div className="tp-skeleton-line" style={{ width: 100, marginBottom: 18 }} />
        <div className="tp-skeleton" style={{ minHeight: 120, borderRadius: 10 }} />
      </div>
    </div>
  );
}
