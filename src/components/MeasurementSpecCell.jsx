import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import "../styles/AdminDashboard.css";

export default function MeasurementSpecCell({
  customerName,
  subtitle,
  unit = "INCHES",
  measurements = {},
  notes = "",
}) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const sheetRef = useRef(null);

  const entries = Object.entries(measurements || {}).filter(
    ([, val]) => val !== "" && val !== null && val !== undefined,
  );

  if (entries.length === 0) {
    return (
      <span style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>
        Standard Fit / No custom specs
      </span>
    );
  }

  const unitSuffix = unit === "CM" ? " cm" : '"';
  const previewEntries = entries.slice(0, 4);

  const handleDownloadSheet = async () => {
    if (!sheetRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        backgroundColor: "#FFFFFF",
        useCORS: true,
        ignoreElements: (el) => el.dataset?.html2canvasIgnore === "true",
      });

      const safeName = (customerName || "Customer")
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, "_");
      const link = document.createElement("a");
      link.download = `SAGA_Tailor_Sheet_${safeName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {/* Clean 2-Column Preview Pills */}
      <div className="spec-mini-grid">
        {previewEntries.map(([label, val]) => (
          <div
            className="spec-chip"
            key={label}
            title={`${label}: ${val}${unitSuffix}`}
          >
            <span className="spec-chip-label">{label}</span>
            <span className="spec-chip-val">
              {val}
              {unitSuffix}
            </span>
          </div>
        ))}
      </div>

      {/* Expand Full Tailor Spec Sheet Modal */}
      <button
        type="button"
        className="btn-view-sheet"
        onClick={() => setOpen(true)}
      >
        View Full Tailor Sheet ({entries.length})
      </button>

      {open && (
        <div className="saga-modal-backdrop" onClick={() => setOpen(false)}>
          <div
            ref={sheetRef}
            className="spec-sheet-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="spec-sheet-header">
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    color: "var(--gold-accent)",
                    textTransform: "uppercase",
                  }}
                >
                  SAGA ATELIER • MASTER CUTTER SHEET
                </span>
                <h3
                  style={{
                    margin: "4px 0 2px 0",
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.55rem",
                    color: "var(--emerald-primary)",
                  }}
                >
                  {customerName}
                </h3>
                {subtitle && (
                  <div
                    style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}
                  >
                    {subtitle}
                  </div>
                )}
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    backgroundColor: "var(--emerald-primary)",
                    color: "#FFFFFF",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                  }}
                >
                  UNIT: {unit}
                </span>

                {/* Icon-only Download Button (Excluded from exported image) */}
                <button
                  type="button"
                  data-html2canvas-ignore="true"
                  onClick={handleDownloadSheet}
                  disabled={downloading}
                  title="Download Master Cutter Sheet"
                  aria-label="Download Master Cutter Sheet"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    border: "1px solid var(--gold-accent)",
                    backgroundColor: "var(--bg-ivory)",
                    color: "var(--emerald-primary)",
                    cursor: downloading ? "wait" : "pointer",
                    padding: 0,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="spec-sheet-grid">
              {entries.map(([label, val]) => (
                <div className="spec-sheet-cell" key={label}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                    {label}
                  </span>
                  <strong
                    style={{
                      color: "var(--text-charcoal)",
                      fontSize: "0.96rem",
                    }}
                  >
                    {val}
                    {unitSuffix}
                  </strong>
                </div>
              ))}
            </div>

            {notes && (
              <div className="spec-sheet-notes" style={{ marginBottom: 0 }}>
                <strong
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    color: "var(--emerald-primary)",
                  }}
                >
                  Tailoring & Design Instructions:
                </strong>
                <div style={{ whiteSpace: "pre-wrap" }}>{notes}</div>
              </div>
            )}

            <div
              data-html2canvas-ignore="true"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "18px",
              }}
            >
              <button
                type="button"
                className="btn-primary"
                onClick={() => setOpen(false)}
              >
                Close Spec Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
