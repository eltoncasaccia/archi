/* global React */
const { useState } = React;

// =============================================================
// SHARED PRIMITIVES
// =============================================================

const Logo = ({ size = 18, dark = false }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 8,
    fontFamily: "var(--sans)", fontWeight: 600, fontSize: size,
    letterSpacing: "-0.02em", color: dark ? "var(--paper)" : "var(--ink)"
  }}>
    <svg width={size + 2} height={size + 2} viewBox="0 0 22 22" fill="none">
      <path d="M3 11 C 3 6, 7 3, 11 3 C 15 3, 19 6, 19 11 C 19 16, 15 19, 11 19 C 9 19, 7 18, 6 17 L 3 18 L 4.5 15 C 3.5 14, 3 12.5, 3 11 Z"
            fill={dark ? "var(--paper)" : "var(--ink)"} />
      <circle cx="13.5" cy="9.5" r="1.2" fill={dark ? "var(--ink)" : "var(--paper)"} />
    </svg>
    <span>Archi</span>
  </div>
);

const Eyebrow = ({ children, style }) => (
  <div className="eyebrow" style={style}>{children}</div>
);

const Field = ({ label, children, hint }) => (
  <label style={{ display: "block" }}>
    <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>
    {children}
    {hint && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{hint}</div>}
  </label>
);

const Badge = ({ tone = "muted", children }) => (
  <span className={`oa-badge ${tone}`}>{children}</span>
);

// admin sidebar — used across admin screens
const AdminSidebar = ({ active, pendingCount = 7, unreadCount = 3 }) => {
  const items = [
    { key: "dashboard", label: "Dashboard", count: null },
    { key: "proposals", label: "Propostas", count: pendingCount },
    { key: "codes", label: "Códigos de acesso", count: null },
    { key: "notifications", label: "Notificações", count: unreadCount },
  ];
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: "var(--paper)",
      borderRight: "1px solid var(--rule)",
      display: "flex", flexDirection: "column",
      padding: "28px 0",
    }}>
      <div style={{ padding: "0 24px 32px" }}>
        <Logo />
      </div>

      <div style={{ padding: "0 12px", flex: 1 }}>
        <div className="eyebrow" style={{ padding: "0 12px 10px" }}>Painel</div>
        {items.map((it) => {
          const isActive = active === it.key;
          return (
            <div key={it.key}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 12px", marginBottom: 2,
                background: isActive ? "var(--ink)" : "transparent",
                color: isActive ? "var(--paper)" : "var(--ink-2)",
                fontSize: 14, fontWeight: isActive ? 500 : 400,
                borderRadius: 2, cursor: "pointer",
              }}>
              <span>{it.label}</span>
              {it.count != null && it.count > 0 && (
                <span className="mono" style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  background: isActive ? "var(--paper)" : "var(--accent)",
                  color: isActive ? "var(--ink)" : "white",
                  borderRadius: 2,
                }}>{it.count}</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "16px 24px 0", borderTop: "1px solid var(--rule)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 2,
            background: "var(--paper-3)",
            display: "grid", placeItems: "center",
            fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)",
          }}>RM</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Rafael Mendes</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>admin</div>
          </div>
        </div>
        <button className="oa-btn ghost sm" style={{ width: "100%" }}>Sair</button>
      </div>
    </aside>
  );
};

// Page header used in admin content area
const AdminHeader = ({ eyebrow, title, right }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "flex-end",
    padding: "32px 40px 24px",
    borderBottom: "1px solid var(--rule)",
  }}>
    <div>
      <Eyebrow style={{ marginBottom: 8 }}>{eyebrow}</Eyebrow>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em" }}>{title}</h1>
    </div>
    {right}
  </div>
);

Object.assign(window, { Logo, Eyebrow, Field, Badge, AdminSidebar, AdminHeader });
