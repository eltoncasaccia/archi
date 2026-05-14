/* global React, MarkPrimary */

// Full lockup — mark + wordmark
const Wordmark = ({ scale = 1, dark = false, mark: Mark = MarkPrimary }) => {
  const ink = dark ? "var(--paper)" : "var(--ink)";
  const paper = dark ? "var(--ink)" : "var(--paper)";
  const accent = "var(--accent)";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 14 * scale,
      padding: 4,
    }}>
      <Mark size={56 * scale} ink={ink} paper={paper} accent={accent} />
      <div style={{
        fontFamily: "Geist, sans-serif",
        fontWeight: 600,
        fontSize: 36 * scale,
        letterSpacing: "-0.03em",
        color: ink,
        lineHeight: 1,
      }}>
        Arch<span style={{ color: accent }}>i</span>
      </div>
    </div>
  );
};

window.Wordmark = Wordmark;
