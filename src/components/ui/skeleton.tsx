export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`tp-skeleton ${className}`} aria-hidden="true" />;
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
