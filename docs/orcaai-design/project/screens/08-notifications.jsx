/* global React, AdminSidebar, AdminHeader, Eyebrow */
// =============================================================
// SCREEN 8 — Notificações
// route: /admin/notifications
// =============================================================

const notifData = [
  {
    group: "Hoje",
    items: [
      { ok: true, msg: "Pipeline concluído para Carla Bezerra (Suplementex Brasil).", ctx: "Proposta p_8a91 · pronta para revisão", time: "há 14 min", unread: true },
      { ok: false, msg: "Falha na etapa Pricing para Paulo Henrique (OFC Logística).", ctx: "Erro: timeout no worker-2 · proposta p_8a8d", time: "há 2 horas", unread: true },
      { ok: true, msg: "Proposta enviada para Helena Vasconcelos (Studio Móveis).", ctx: "Email entregue · 1 DOCX, 1 PDF", time: "há 5 horas", unread: true },
      { ok: true, msg: "Pipeline concluído para Aline Cardoso (Vita Clínicas).", ctx: "Proposta p_8a90 · pronta para revisão", time: "há 7 horas", unread: false },
    ]
  },
  {
    group: "Ontem · 07 mai",
    items: [
      { ok: true, msg: "Proposta enviada para Roger Tavares (Tavares Advocacia).", ctx: "Email entregue · 1 DOCX, 1 PDF", time: "ontem · 18:42", unread: false },
      { ok: false, msg: "Falha na etapa Discovery para Marina Felix (Felix Cosméticos).", ctx: "Erro: limite de tokens excedido · resolvido", time: "ontem · 11:08", unread: false },
      { ok: true, msg: "Pipeline concluído para Mateus Aragão (Café do Centro).", ctx: "Proposta p_8a8f · aprovada por Rafael", time: "ontem · 09:25", unread: false },
    ]
  },
  {
    group: "Esta semana",
    items: [
      { ok: true, msg: "Pipeline concluído para Beatriz Lima (Casa Andorinha).", ctx: "Proposta p_8a8c · enviada · email entregue", time: "06 mai · 14:11", unread: false },
      { ok: true, msg: "Proposta enviada para Diego Otaviano (Otaviano & Partners).", ctx: "Email entregue · 1 DOCX, 1 PDF", time: "03 mai · 16:22", unread: false },
    ]
  },
];

function ScreenNotifications() {
  return (
    <div className="oa-root" style={{ width: "100%", height: "100%", display: "flex", background: "var(--paper)" }}>
      <AdminSidebar active="notifications" pendingCount={7} unreadCount={3} />

      <div style={{ flex: 1, overflow: "auto" }}>
        <AdminHeader
          eyebrow="Painel · Alertas"
          title="Notificações"
          right={
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                3 não lidas · 9 totais
              </span>
              <button className="oa-btn ghost sm">Marcar todas como lidas</button>
            </div>
          }
        />

        <div style={{ padding: "24px 40px 64px", maxWidth: 920 }}>
          {/* filter strip */}
          <div style={{
            display: "flex", gap: 4, marginBottom: 20,
            borderBottom: "1px solid var(--rule)",
          }}>
            {[
              { label: "Todas", count: 9, active: true },
              { label: "Não lidas", count: 3 },
              { label: "Sucessos", count: 7 },
              { label: "Erros", count: 2 },
            ].map((t, i) => (
              <button key={i} style={{
                padding: "10px 14px", border: 0, background: "transparent",
                fontSize: 13, fontWeight: t.active ? 500 : 400,
                color: t.active ? "var(--ink)" : "var(--muted)",
                borderBottom: t.active ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom: -1,
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                {t.label}
                <span className="mono" style={{
                  fontSize: 10, padding: "1px 6px",
                  background: t.active ? "var(--accent-soft)" : "var(--paper-2)",
                  color: t.active ? "var(--accent-ink)" : "var(--muted)",
                }}>{t.count}</span>
              </button>
            ))}
          </div>

          {notifData.map((g, gi) => (
            <div key={gi} style={{ marginBottom: 28 }}>
              <Eyebrow style={{ marginBottom: 10 }}>{g.group}</Eyebrow>
              <div className="oa-card">
                {g.items.map((n, i) => <NotifRow key={i} n={n} first={i === 0} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotifRow({ n, first }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr auto auto",
      gap: 14,
      padding: "16px 18px",
      borderTop: first ? "none" : "1px solid var(--rule-2)",
      alignItems: "center",
      background: n.unread ? "var(--paper)" : "var(--paper)",
      cursor: "pointer",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 2, flexShrink: 0,
        background: n.ok ? "var(--ok-soft)" : "var(--danger-soft)",
        color: n.ok ? "oklch(0.40 0.10 145)" : "oklch(0.42 0.14 25)",
        display: "grid", placeItems: "center",
        fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600,
      }}>{n.ok ? "✓" : "✕"}</div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: n.unread ? 500 : 400, lineHeight: 1.4 }}>
          {n.msg}
        </div>
        <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
          {n.ctx}
        </div>
      </div>

      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
        {n.time}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 4 }}>
        {n.unread && (
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--accent)",
          }} />
        )}
        <a className="mono" style={{ fontSize: 12, color: "var(--ink)", textDecoration: "underline", whiteSpace: "nowrap" }}>
          ver proposta →
        </a>
      </div>
    </div>
  );
}

window.ScreenNotifications = ScreenNotifications;
