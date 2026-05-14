/* global React, AdminSidebar, AdminHeader, Eyebrow, Badge */
// =============================================================
// SCREEN 4 — Dashboard
// route: /admin
// =============================================================
function ScreenDashboard() {
  return (
    <div className="oa-root" style={{
      width: "100%", height: "100%",
      display: "flex", background: "var(--paper)",
    }}>
      <AdminSidebar active="dashboard" pendingCount={7} unreadCount={3} />

      <div style={{ flex: 1, overflow: "auto" }}>
        <AdminHeader
          eyebrow="Visão geral · 08 mai 2026"
          title="Boa tarde, Rafael."
          right={
            <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
              último sync · 14:22:08
            </div>
          }
        />

        <div style={{ padding: "32px 40px 64px" }}>
          {/* SUMMARY CARDS */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            border: "1px solid var(--rule)",
            background: "var(--paper)",
          }}>
            {[
              { label: "Aguardando revisão", value: "7", delta: "+3 hoje", tone: "warn" },
              { label: "Enviadas hoje", value: "2", delta: "—", tone: "ok" },
              { label: "Total de sessões", value: "184", delta: "+12 semana", tone: null },
              { label: "Erros no pipeline", value: "1", delta: "investigar", tone: "danger" },
            ].map((c, i) => (
              <div key={i} style={{
                padding: "24px",
                borderRight: i < 3 ? "1px solid var(--rule)" : "none",
                position: "relative",
              }}>
                <Eyebrow style={{ marginBottom: 14 }}>{c.label}</Eyebrow>
                <div style={{
                  display: "flex", alignItems: "baseline", justifyContent: "space-between",
                }}>
                  <div style={{
                    fontSize: 44, fontWeight: 400, letterSpacing: "-0.03em",
                    fontVariantNumeric: "tabular-nums",
                  }}>{c.value}</div>
                  {c.tone && (
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: `var(--${c.tone})`,
                    }} />
                  )}
                </div>
                <div className="mono" style={{
                  fontSize: 11, color: "var(--muted)",
                  marginTop: 4,
                }}>{c.delta}</div>
              </div>
            ))}
          </div>

          {/* SECONDARY ROW */}
          <div style={{
            display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24,
            marginTop: 32,
          }}>
            {/* Atividade recente */}
            <section>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                marginBottom: 12,
              }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}>
                  Atividade recente
                </h2>
                <a style={{ fontSize: 12, color: "var(--muted)", textDecoration: "underline" }}>
                  Ver todas →
                </a>
              </div>

              <div className="oa-card">
                {[
                  { name: "Carla Bezerra", co: "Suplementex Brasil", date: "08 mai · 14:09", status: "pending_review" },
                  { name: "Mateus Aragão", co: "Café do Centro", date: "08 mai · 11:42", status: "approved" },
                  { name: "Helena Vasconcelos", co: "Studio Móveis", date: "08 mai · 09:15", status: "sent" },
                  { name: "Paulo Henrique", co: "OFC Logística", date: "07 mai · 18:33", status: "pipeline_error" },
                  { name: "Aline Cardoso", co: "Vita Clínicas", date: "07 mai · 16:12", status: "pending_review" },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1fr 0.8fr 0.6fr",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderTop: i === 0 ? "none" : "1px solid var(--rule-2)",
                    fontSize: 14,
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{row.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{row.co}</div>
                    </div>
                    <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{row.date}</div>
                    <div><StatusBadge status={row.status} /></div>
                    <div style={{ textAlign: "right" }}>
                      <a className="mono" style={{ fontSize: 12, color: "var(--ink)", textDecoration: "underline" }}>abrir</a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Notificações recentes */}
            <section>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                marginBottom: 12,
              }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}>
                  Notificações
                </h2>
                <a style={{ fontSize: 12, color: "var(--muted)", textDecoration: "underline" }}>
                  Ver todas →
                </a>
              </div>

              <div className="oa-card">
                {[
                  { ok: true, msg: "Pipeline concluído para Carla Bezerra (Suplementex)", time: "há 14 min", unread: true },
                  { ok: false, msg: "Falha na etapa Pricing — Paulo Henrique (OFC Logística)", time: "há 2 horas", unread: true },
                  { ok: true, msg: "Proposta enviada para Helena Vasconcelos", time: "há 5 horas", unread: true },
                ].map((n, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 12,
                    padding: "14px 18px",
                    borderTop: i === 0 ? "none" : "1px solid var(--rule-2)",
                  }}>
                    <div style={{
                      width: 22, height: 22, marginTop: 1,
                      borderRadius: 2, flexShrink: 0,
                      background: n.ok ? "var(--ok-soft)" : "var(--danger-soft)",
                      color: n.ok ? "oklch(0.40 0.10 145)" : "oklch(0.42 0.14 25)",
                      display: "grid", placeItems: "center",
                      fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600,
                    }}>{n.ok ? "✓" : "✕"}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, lineHeight: 1.45 }}>{n.msg}</div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{n.time}</div>
                    </div>

                    {n.unread && (
                      <span style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: "var(--accent)", marginTop: 8, flexShrink: 0,
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending_review: { tone: "warn", label: "Aguardando" },
    approved: { tone: "info", label: "Aprovada" },
    sent: { tone: "ok", label: "Enviada" },
    rejected: { tone: "danger", label: "Rejeitada" },
    pipeline_error: { tone: "danger", label: "Erro" },
  };
  const s = map[status] || map.pending_review;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

window.ScreenDashboard = ScreenDashboard;
window.StatusBadge = StatusBadge;
