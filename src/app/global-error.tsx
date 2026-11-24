"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f5f1",
          color: "#1f2024",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.75 }}>
            The page could not be loaded. Try again, or return to the Toolpika homepage.
          </p>
          <button
            type="button"
            onClick={retry}
            style={{
              marginTop: 18,
              padding: "10px 18px",
              borderRadius: 10,
              border: 0,
              background: "#5b4bff",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
