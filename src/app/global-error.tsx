"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", background: "#fdfbf8", color: "#2c2521" }}>
        <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ opacity: 0.7, marginBottom: 16 }}>Reload to get back to your memories.</p>
            <button
              onClick={reset}
              style={{ padding: "10px 24px", borderRadius: 999, background: "#2c2521", color: "#fdfbf8", border: 0, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
