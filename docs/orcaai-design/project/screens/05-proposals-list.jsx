/* global React, AdminSidebar, AdminHeader, Eyebrow, StatusBadge */
// =============================================================
// SCREEN 5 — Lista de Propostas
// route: /admin/proposals
// =============================================================

const proposalsData = [
  { id: "p_8a91", name: "Carla Bezerra",      co: "Suplementex Brasil",   email: "carla@suplementex.com.br",  date: "08 mai 2026", price: 184500, status: "pending_review" },
  { id: "p_8a90", name: "Aline Cardoso",      co: "Vita Clínicas",        email: "aline@vita.med.br",          date: "07 mai 2026", price: 92000,  status: "pending_review" },
  { id: "p_8a8f", name: "Mateus Aragão",      co: "Café do Centro",       email: "mateus@cafedocentro.com",   date: "07 mai 2026", price: 48000,  status: "approved" },
  { id: "p_8a8e", name: "Helena Vasconcelos", co: "Studio Móveis",        email: "helena@studiomoveis.cc",    date: "06 mai 2026", price: 126000, status: "sent" },
  { id: "p_8a8d", name: "Paulo Henrique",     co: "OFC Logística",        email: "paulo@ofclog.com.br",       email: "paulo@ofclog.com.br", date: "06 mai 2026", price: null,   status: "pipeline_error" },
  { id: "p_8a8c", name: "Beatriz Lima",       co: "Casa Andorinha",       email: "bia@casaandorinha.com.br",  date: "05 mai 2026", price: 67000,  status: "sent" },
  { id: "p_8a8b", name: "Roger Tavares",      co: "Tavares Advocacia",    email: "roger@tavaresadv.br",       date: "05 mai 2026", price: 215000, status: "approved" },
  { id: "p_8a8a", name: "Marina Felix",       co: "Felix Cosméticos",     email: "marina@felixcosm.com",      date: "04 mai 2026", price: 84500,  status: "rejected" },
  { id: "p_8a89", name: "Diego Otaviano",     co: "Otaviano & Partners",  email: "diego@op.law",              date: "03 mai 2026", price: 305000, status: "sent" },
];

const tabs = [
  { key: "all",    label: "Todas",            count: 184 },
  { key: "pend",   label: "Aguardando rev.",  count: 7,  active: true },
  { key: "appr",   label: "Aprovadas",        count: 12 },
  { key: "sent",   label: "Enviadas",         count: 161 },
  { key: "err",    label: "Erro",             count: 1 },
];

function fmtBRL(v) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

function ScreenProposals() {
  return (
    <div className="oa-root" style={{ width: "100%", height: "100%", display: "flex", background: "var(--paper)" }}>
      <AdminSidebar active="proposals" pendingCount={7} unreadCount={3} />

      <div style={{ flex: 1, overflow: "auto" }}>
        <AdminHeader
          eyebrow="Painel · Propostas"
          title="Propostas"
          right={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", border: "1px solid var(--rule)",
                borderRadius: 2, background: "var(--paper)", minWidth: 240,
              }}>
                <span style={{ color: "var(--muted-2)", fontSize: 14 }}>⌕</span>
                <input placeholder="Buscar por cliente, email ou ID…" style={{
                  border: 0, outline: 0, background: "transparent",
                  fontSize: 13, flex: 1, color: "var(--ink)",
                }} />
                <span className="mono" style={{ fontSize: 10, color: "var(--muted-2)", padding: "1px 5px", border: "1px solid var(--rule)" }}>⌘K</span>
              </div>
              <button className="oa-btn ghost sm">Exportar CSV</button>
            </div>
          }
        />

        <div style={{ padding: "24px 40px 64px" }}>
          {/* TABS */}
          <div style={{
            display: "flex", gap: 4, borderBottom: "1px solid var(--rule)",
            marginBottom: 0,
          }}>
            {tabs.map((t) => (
              <button key={t.key} style={{
                padding: "12px 16px", border: 0, background: "transparent",
                fontSize: 13, fontWeight: t.active ? 500 : 400,
                color: t.active ? "var(--ink)" : "var(--muted)",
                borderBottom: t.active ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                {t.label}
                <span className="mono" style={{
                  fontSize: 10, padding: "1px 6px", borderRadius: 2,
                  background: t.active ? "var(--accent-soft)" : "var(--paper-2)",
                  color: t.active ? "var(--accent-ink)" : "var(--muted)",
                }}>{t.count}</span>
              </button>
            ))}
          </div>

          {/* TABLE */}
          <div className="oa-card" style={{ borderTop: 0, marginTop: 0 }}>
            {/* head */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "0.6fr 1.6fr 1.4fr 0.9fr 1fr 0.9fr 0.5fr",
              padding: "12px 18px",
              borderBottom: "1px solid var(--rule)",
              background: "var(--paper-2)",
            }}>
              {["ID", "Cliente", "Email", "Data", "Preço total", "Status", ""].map((h, i) => (
                <div key={i} className="eyebrow">{h}</div>
              ))}
            </div>

            {proposalsData.map((p, i) => (
              <div key={p.id} style={{
                display: "grid",
                gridTemplateColumns: "0.6fr 1.6fr 1.4fr 0.9fr 1fr 0.9fr 0.5fr",
                padding: "16px 18px",
                borderTop: i === 0 ? "none" : "1px solid var(--rule-2)",
                alignItems: "center", fontSize: 14,
                background: p.status === "pending_review" ? "rgba(0,0,0,0)" : "transparent",
              }}>
                <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{p.id}</div>
                <div>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{p.co}</div>
                </div>
                <div className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{p.email}</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{p.date}</div>
                <div className="mono" style={{
                  fontSize: 14, fontVariantNumeric: "tabular-nums",
                  color: p.price == null ? "var(--muted-2)" : "var(--ink)",
                }}>{fmtBRL(p.price)}</div>
                <div><StatusBadge status={p.status} /></div>
                <div style={{ textAlign: "right" }}>
                  <button className="oa-btn ghost sm" style={{ padding: "5px 10px", fontSize: 12 }}>Revisar →</button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 18, fontSize: 12, color: "var(--muted)",
          }}>
            <span className="mono">mostrando 1–9 de 184</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="oa-btn ghost sm" style={{ padding: "4px 10px" }}>←</button>
              {[1,2,3,4,5].map((n) => (
                <button key={n} style={{
                  padding: "4px 10px", border: "1px solid var(--rule)",
                  background: n === 1 ? "var(--ink)" : "transparent",
                  color: n === 1 ? "var(--paper)" : "var(--ink)",
                  fontSize: 12, fontFamily: "var(--mono)", borderRadius: 2,
                  cursor: "pointer",
                }}>{n}</button>
              ))}
              <span style={{ alignSelf: "center", padding: "0 4px" }}>…</span>
              <button className="oa-btn ghost sm" style={{ padding: "4px 10px" }}>10</button>
              <button className="oa-btn ghost sm" style={{ padding: "4px 10px" }}>→</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ScreenProposals = ScreenProposals;
window.fmtBRL = fmtBRL;
