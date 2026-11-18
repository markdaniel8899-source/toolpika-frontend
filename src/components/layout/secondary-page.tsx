export function SecondaryPage({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="tp-atlas-page">
      <div className="tp-atlas-glow" aria-hidden="true">
        <span className="glow-one" />
        <span className="glow-two" />
        <span className="glow-three" />
      </div>
      <main className={`tp-container tp-atlas-main${wide ? " is-wide" : ""}`}>
        {children}
      </main>
    </div>
  );
}
