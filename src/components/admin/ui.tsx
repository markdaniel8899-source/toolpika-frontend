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
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-sans text-[30px] tracking-[-0.02em] sm:text-[34px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl leading-[1.6] text-[var(--muted)]">
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
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 font-sans text-[30px] font-bold leading-none tracking-[-0.02em] tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-[1.5] text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-sm leading-[1.6] text-[var(--muted)]">
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
    <section
      className={`rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 ${className ?? ""}`}
    >
      {title ? (
        <h2 className="font-sans text-[20px] tracking-[-0.02em]">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-1.5 text-sm leading-[1.6] text-[var(--muted)]">
          {description}
        </p>
      ) : null}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

const STATUS_STYLES: Record<string, string> = {
  live: "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]",
  published: "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]",
  draft: "border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]",
  hidden: "border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]",
  new: "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]",
  building: "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]",
  launched: "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] ${
        STATUS_STYLES[status] ?? STATUS_STYLES.draft
      }`}
    >
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
    <div className="-mx-5 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)] first:pl-0 last:pr-0"
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
