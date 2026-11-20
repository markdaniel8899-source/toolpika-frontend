export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-sans text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[32px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-[13px] leading-[1.6] text-[var(--muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="tp-admin-card tp-admin-stat p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-3 font-sans text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-2.5 text-xs leading-[1.5] text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-5 py-8 text-center text-[13px] leading-[1.6] text-[var(--muted)]">
      {message}
    </p>
  );
}

export function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`tp-admin-card p-5 sm:p-6 ${className ?? ""}`}>
      {title ? (
        <h2 className="font-sans text-[18px] font-semibold leading-snug tracking-[-0.02em]">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-1.5 text-[13px] leading-[1.6] text-[var(--muted)]">
          {description}
        </p>
      ) : null}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

const STATUS_TONES: Record<string, string> = {
  live: "success",
  published: "success",
  launched: "success",
  new: "accent",
  building: "accent",
  rejected: "danger",
  draft: "neutral",
  hidden: "neutral",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="tp-status-pill" data-tone={STATUS_TONES[status] ?? "neutral"}>
      {status}
    </span>
  );
}

export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div data-ui className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="tp-admin-table w-full min-w-[640px] border-collapse text-left text-[13px]">
        <thead>
          <tr data-ui className="border-b border-[var(--border)]">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)] first:pl-0 last:pr-0"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
