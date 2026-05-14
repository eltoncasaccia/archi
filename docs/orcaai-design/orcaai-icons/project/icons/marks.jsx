/* global React */
// =============================================================
// Archi — icon marks
// All marks are pure SVG, drawn on a 64×64 grid.
// ink = foreground · paper = background · accent = burnt orange
// =============================================================

// MARK A — "Discovery bubble"
// Speech bubble (= entrevista) with a counted tally inside
// (= contagem do orçamento). Reads as both chat and counter.
const MarkA = ({ size = 64, ink = "var(--ink)", paper = "var(--paper)", accent = "var(--accent)" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 28 C8 16, 18 8, 32 8 C46 8, 56 16, 56 28 C56 40, 46 48, 32 48
         C28 48, 24 47.4, 21 46 L11 50 L14 41 C10.5 37.5, 8 33, 8 28 Z"
      fill={ink}
    />
    {/* tally — four strokes + a diagonal */}
    <g stroke={paper} strokeWidth="2.4" strokeLinecap="round">
      <line x1="22" y1="22" x2="22" y2="34" />
      <line x1="27" y1="22" x2="27" y2="34" />
      <line x1="32" y1="22" x2="32" y2="34" />
      <line x1="37" y1="22" x2="37" y2="34" />
    </g>
    <line x1="20" y1="34" x2="39" y2="22" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

// MARK B — "Quote → ledger"
// Open paren / quote mark made of stacked horizontal rules,
// like rows of a ledger. Conceptually: "the quote (orçamento) is data".
const MarkB = ({ size = 64, ink = "var(--ink)", paper = "var(--paper)", accent = "var(--accent)" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" fill={paper} />
    {/* O carved from horizontal rules */}
    <g stroke={ink} strokeWidth="3.2" strokeLinecap="square">
      <path d="M16 18 Q16 10, 24 10 H 40 Q 48 10, 48 18" fill="none" />
      <line x1="13" y1="22" x2="51" y2="22" />
      <line x1="13" y1="29" x2="51" y2="29" />
      <line x1="13" y1="36" x2="51" y2="36" />
      <line x1="13" y1="43" x2="51" y2="43" />
      <path d="M16 47 Q16 55, 24 55 H 40 Q 48 55, 48 47" fill="none" />
    </g>
    {/* one row marked in accent — the line that matters */}
    <line x1="13" y1="36" x2="35" y2="36" stroke={accent} strokeWidth="3.2" strokeLinecap="square" />
  </svg>
);

// MARK C — "O monogram, sliced"
// The A of Archi cut by the speech-bubble tail. Pure geometry.
const MarkC = ({ size = 64, ink = "var(--ink)", paper = "var(--paper)", accent = "var(--accent)" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" fill={paper} />
    <circle cx="32" cy="32" r="22" stroke={ink} strokeWidth="6" fill="none" />
    {/* speech tail cut */}
    <path d="M48 44 L 60 56 L 50 48 Z" fill={ink} />
    {/* accent dot — the cursor / agent */}
    <circle cx="44" cy="24" r="4" fill={accent} />
  </svg>
);

// MARK D — "Stacked O" — type-driven monogram
const MarkD = ({ size = 64, ink = "var(--ink)", paper = "var(--paper)", accent = "var(--accent)" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" fill={ink} />
    <text
      x="32" y="48"
      textAnchor="middle"
      fontFamily="Geist, sans-serif"
      fontWeight="600"
      fontSize="48"
      letterSpacing="-2"
      fill={paper}
    >Or</text>
    <circle cx="50" cy="20" r="4" fill={accent} />
  </svg>
);

// MARK E — "Document corner"
// A document with a bite cut from the corner forming a tail
// — proposal as the artifact + chat as the source.
const MarkE = ({ size = 64, ink = "var(--ink)", paper = "var(--paper)", accent = "var(--accent)" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" fill={paper} />
    {/* page */}
    <path
      d="M14 8 H 44 L 54 18 V 56 H 14 Z"
      fill={ink}
    />
    {/* folded corner */}
    <path d="M44 8 V 18 H 54 Z" fill={paper} stroke={ink} strokeWidth="1.5" />
    {/* lines = price rows */}
    <g stroke={paper} strokeWidth="2" strokeLinecap="round">
      <line x1="22" y1="30" x2="46" y2="30" />
      <line x1="22" y1="38" x2="46" y2="38" />
      <line x1="22" y1="46" x2="36" y2="46" />
    </g>
    {/* total bar */}
    <rect x="22" y="50" width="14" height="2.5" fill={accent} />
  </svg>
);

// MARK F — "Cursor + bubble"
// Minimal: a chat tail rendered as an angle bracket. Reads as
// terminal prompt + speech bubble simultaneously.
const MarkF = ({ size = 64, ink = "var(--ink)", paper = "var(--paper)", accent = "var(--accent)" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" fill={paper} />
    <path
      d="M14 16 L 32 32 L 14 48"
      stroke={ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"
    />
    <line x1="36" y1="48" x2="52" y2="48" stroke={ink} strokeWidth="6" strokeLinecap="round" />
    {/* cursor blink */}
    <rect x="46" y="14" width="6" height="14" fill={accent} />
  </svg>
);

// PRIMARY — the original lockup mark, refined
// (kept consistent with the logo used inside the product)
const MarkPrimary = ({ size = 64, ink = "var(--ink)", paper = "var(--paper)", accent = "var(--accent)" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" fill={paper} />
    {/* speech bubble */}
    <path
      d="M10 30 C10 18, 20 10, 32 10 C44 10, 54 18, 54 30 C54 42, 44 50, 32 50
         C28 50, 24 49.2, 20.5 47.5 L 12 52 L 15 43 C 12 39.5, 10 35, 10 30 Z"
      fill={ink}
    />
    {/* accent dot — positioned like the cursor / interview agent */}
    <circle cx="40" cy="26" r="5" fill={accent} />
    {/* second pip */}
    <circle cx="26" cy="30" r="2.6" fill={paper} />
  </svg>
);

Object.assign(window, {
  MarkA, MarkB, MarkC, MarkD, MarkE, MarkF, MarkPrimary,
});
