/* global React, AdminSidebar, AdminHeader, Eyebrow, Badge */
const { useState: useState7 } = React;

// =============================================================
// SCREEN 7 — Códigos de Acesso
// route: /admin/access-codes
// =============================================================

const codesData = [
  { code: "ARC-2026-042", status: "available", created: "08 mai 2026", used: null,           expires: "—",            client: null },
  { code: "ARC-2026-041", status: "available", created: "08 mai 2026", used: null,           expires: "15 mai 2026",  client: null },
  { code: "ARC-2026-040", status: "expired",   created: "01 mai 2026", used: null,           expires: "07 mai 2026",  client: null },
  { code: "ARC-2026-039", status: "used",      created: "07 mai 2026", used: "08 mai 2026",  expires: "—",            client: "Carla Bezerra · Suplementex" },
  { code: "ARC-2026-038", status: "used",      created: "06 mai 2026", used: "07 mai 2026",  expires: "—",            client: "Aline Cardoso · Vita Clínicas" },
  { code: "ARC-2026-037", status: "used",      created: "05 mai 2026", used: "07 mai 2026",  expires: "—",            client: "Mateus Aragão · Café do Centro" },
  { code: "ARC-2026-036", status: "used",      created: "04 mai 2026", used: "06 mai 2026",  expires: "—",            client: "Helena Vasconcelos · Studio Móveis" },
  { code: "ARC-2026-035", status: "expired",   created: "20 abr 2026", used: null,           expires: "30 abr 2026",  client: null },
];

function ScreenAccessCodes() {
  const [showModal, setShowModal] = useState7(false);
  const [generated, setGenerated] = useState7(false);

  return (
    <div className="oa-root" style={{ width: "100%", height: "100%", display: "flex", background: "var(--paper)", position: "relative" }}>
      <AdminSidebar active="codes" pendingCount={7} unreadCount={3} />

      <div style={{ flex: 1, overflow: "auto" }}>
        <AdminHeader
          eyebrow="Painel · Acesso"
          title="Códigos de acesso"
          right={
            <button className="oa-btn accent" onClick={() => { setShowModal(true); setGenerated(false); }}>
              + Gerar novo código
            </button>
          }
        />

        <div style={{ padding: "24px 40px 64px" }}>
          {/* Summary strip */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            border: "1px solid var(--rule)", marginBottom: 24,
          }}>
            {[
              { label: "Disponíveis", value: 2, tone: "ok" },
              { label: "Utilizados",   value: 174, tone: null },
              { label: "Expirados",   value: 8, tone: "warn" },
            ].map((c, i) => (
              <div key={i} style={{
                padding: "20px 24px",
                borderRight: i < 2 ? "1px solid var(--rule)" : "none",
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
              }}>
                <Eyebrow>{c.label}</Eyebrow>
                <div className="mono" style={{
                  fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* TABLE */}
          <div className="oa-card">
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 0.9fr 1fr 1fr 1fr 1.4fr",
              padding: "12px 18px",
              borderBottom: "1px solid var(--rule)",
              background: "var(--paper-2)",
            }}>
              {["Código", "Status", "Criado em", "Utilizado em", "Expira em", "Cliente"].map((h, i) => (
                <div key={i} className="eyebrow">{h}</div>
              ))}
            </div>

            {codesData.map((row, i) => (
              <div key={row.code} style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 0.9fr 1fr 1fr 1fr 1.4fr",
                padding: "14px 18px",
                borderTop: i === 0 ? "none" : "1px solid var(--rule-2)",
                alignItems: "center", fontSize: 13,
              }}>
                <div className="mono" style={{
                  fontSize: 14, letterSpacing: "0.04em",
                  color: row.status === "expired" ? "var(--muted-2)" : "var(--ink)",
                  textDecoration: row.status === "expired" ? "line-through" : "none",
                }}>{row.code}</div>
                <div>
                  {row.status === "available" && <Badge tone="ok">Disponível</Badge>}
                  {row.status === "used"      && <Badge tone="muted">Utilizado</Badge>}
                  {row.status === "expired"   && <Badge tone="danger">Expirado</Badge>}
                </div>
                <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{row.created}</div>
                <div className="mono" style={{ fontSize: 12, color: row.used ? "var(--ink-2)" : "var(--muted-2)" }}>{row.used || "—"}</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{row.expires}</div>
                <div style={{ fontSize: 13, color: row.client ? "var(--ink-2)" : "var(--muted-2)" }}>{row.client || "—"}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
            Códigos não podem ser deletados — apenas visualizados, para auditoria.
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(21, 17, 13, 0.45)",
          display: "grid", placeItems: "center",
          zIndex: 50,
        }}>
          <div className="oa-card" style={{
            width: 460, padding: "28px 28px 24px",
            background: "var(--paper)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          }}>
            <Eyebrow style={{ marginBottom: 8 }}>Novo código</Eyebrow>
            <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em" }}>
              {generated ? "Código gerado" : "Gerar código de acesso"}
            </h3>

            {!generated ? (
              <>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Data de expiração (opcional)</div>
                <input className="oa-input" defaultValue="" placeholder="dd/mm/aaaa  ·  vazio = sem expiração" style={{ fontFamily: "var(--sans)" }} />
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                  Sem preenchimento, o código não expira até ser utilizado.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
                  <button className="oa-btn ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button className="oa-btn accent" onClick={() => setGenerated(true)}>Gerar</button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  padding: "20px",
                  background: "var(--ink)",
                  color: "var(--paper)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 16,
                }}>
                  <div className="mono" style={{
                    fontSize: 22, letterSpacing: "0.08em", fontWeight: 500,
                  }}>ARC-2026-043</div>
                  <button className="oa-btn ghost sm" style={{
                    color: "var(--paper)", borderColor: "rgba(255,255,255,0.3)",
                    background: "transparent",
                  }}>Copiar ⎘</button>
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>
                  Envie este código para o cliente. Ele só pode ser usado uma vez.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
                  <button className="oa-btn" onClick={() => setShowModal(false)}>Concluir</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

window.ScreenAccessCodes = ScreenAccessCodes;
