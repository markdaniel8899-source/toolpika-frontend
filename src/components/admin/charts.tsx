export interface ChartDatum {
  label: string;
  value: number;
}

/**
 * Charts are plain SVG.
 *
 * No charting library: the dashboard needs three simple shapes and pulling a
 * dependency in would add bundle weight for no gain. Colors stay inside the
 * constitution palette - the accent at different opacities plus the neutral
 * tokens.
 */

const SLICE_FILL = [
  "var(--accent)",
  "color-mix(in srgb, var(--accent) 70%, var(--surface))",
  "color-mix(in srgb, var(--accent) 45%, var(--surface))",
  "color-mix(in srgb, var(--muted) 45%, var(--surface))",
  "var(--border)",
];

export function BarChart({
  data,
  emptyLabel,
}: {
  data: ChartDatum[];
  emptyLabel: string;
}) {
  if (data.length === 0 || data.every((item) => item.value === 0)) {
    return <ChartEmpty label={emptyLabel} />;
  }

  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <ul className="flex flex-col gap-3.5">
      {data.map((item) => {
        const percent = Math.round((item.value / max) * 100);

        return (
          <li key={item.label} className="flex items-center gap-3">
            <span
              className="w-24 shrink-0 truncate text-[12px] font-medium text-[var(--text)]"
              title={item.label}
            >
              {item.label}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <span
                className="block h-full rounded-full bg-[var(--accent-fill)]"
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="w-9 shrink-0 text-right text-[12px] font-semibold tabular-nums text-[var(--muted)]">
              {item.value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function LineChart({
  data,
  emptyLabel,
}: {
  data: ChartDatum[];
  emptyLabel: string;
}) {
  if (data.length === 0 || data.every((item) => item.value === 0)) {
    return <ChartEmpty label={emptyLabel} />;
  }

  const width = 640;
  const height = 200;
  const padding = { top: 16, right: 8, bottom: 28, left: 34 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((item) => item.value), 1);

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? padding.left + innerWidth / 2
        : padding.left + (index / (data.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - (item.value / max) * innerHeight;
    return { x, y };
  });

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  const area = `${line} L${points[points.length - 1].x},${
    padding.top + innerHeight
  } L${points[0].x},${padding.top + innerHeight} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`Line chart with ${data.length} points`}
      >
        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={width - padding.right}
          y2={padding.top + innerHeight}
          stroke="var(--border)"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerHeight}
          stroke="var(--border)"
          strokeWidth="1"
        />
        <path d={area} fill="var(--accent)" opacity="0.12" />
        <path
          d={line}
          fill="none"
          stroke="var(--accent-fill)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <circle
            key={data[index].label}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="var(--accent-fill)"
          />
        ))}
      </svg>
      <ul className="mt-2 flex justify-between text-[11px] text-[var(--muted)]">
        {data.map((item, index) => (
          <li key={item.label}>
            {index % Math.ceil(data.length / 7) === 0 ? item.label : null}
          </li>
        ))}
      </ul>
      <table className="sr-only">
        <caption>Values</caption>
        <tbody>
          {data.map((item) => (
            <tr key={item.label}>
              <th scope="row">{item.label}</th>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PieChart({
  data,
  emptyLabel,
}: {
  data: ChartDatum[];
  emptyLabel: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0 || total === 0) {
    return <ChartEmpty label={emptyLabel} />;
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  // Offsets are computed up front with a pure reduce - no mutation while
  // rendering.
  const segments = data.reduce<
    { label: string; dash: number; gap: number; offset: number; fill: string }[]
  >((acc, item, index) => {
    const dash = (item.value / total) * circumference;
    const previous = acc[acc.length - 1];
    const offset = previous ? previous.offset + previous.dash : 0;

    return [
      ...acc,
      {
        label: item.label,
        dash,
        gap: circumference - dash,
        offset,
        fill: SLICE_FILL[index % SLICE_FILL.length],
      },
    ];
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <svg
        viewBox="0 0 200 200"
        className="h-[180px] w-[180px] shrink-0"
        role="img"
        aria-label={`Pie chart with ${data.length} slices`}
      >
        <g transform="translate(100, 100) rotate(-90)">
          {segments.map((segment) => (
            <circle
              key={segment.label}
              r={radius}
              cx="0"
              cy="0"
              fill="none"
              stroke={segment.fill}
              strokeWidth="36"
              strokeDasharray={`${segment.dash} ${segment.gap}`}
              strokeDashoffset={-segment.offset}
            />
          ))}
        </g>
      </svg>

      <ul className="flex flex-col gap-2 text-sm">
        {data.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: SLICE_FILL[index % SLICE_FILL.length] }}
            />
            <span className="text-[var(--muted)]">{item.label}</span>
            <span className="font-bold tabular-nums">
              {Math.round((item.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <p className="rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-4 py-6 text-center text-[12px] leading-[1.6] text-[var(--muted)]">
      {label}
    </p>
  );
}
