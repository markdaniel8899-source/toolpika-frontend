/** Shared visual for tool Open Graph and Twitter share images. */
export function ToolShareImage({ title }: { title: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0b0c0f",
        color: "#f6f6f7",
        padding: "72px 80px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
            background: "#6a5bff",
            color: "#ffffff",
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          T
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
          Toolpika
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>
          {title}
        </div>
        <div style={{ fontSize: 28, color: "#9ea0aa" }}>
          Fast, private tools that run in your browser.
        </div>
      </div>

      <div style={{ fontSize: 22, color: "#6a5bff" }}>toolpika.site</div>
    </div>
  );
}
