/* global React, AdminSidebar, Eyebrow, Badge, StatusBadge, fmtBRL */
const { useState: useState6 } = React;

// =============================================================
// SCREEN 6 — Detalhe da Proposta
// route: /admin/proposals/[id]
// =============================================================
function ScreenProposalDetail() {
  const [tab, setTab] = useState6("discovery");

  return (
    <div className="oa-root" style={{ width: "100%", height: "100%", display: "flex", background: "var(--paper)" }}>
      <AdminSidebar active="proposals" pendingCount={7} unreadCount={3} />

      <div style={{ flex: 1, overflow: "auto" }}>
        {/* SECTION 1 — HEADER */}
        <div style={{
          padding: "28px 40px 24px",
          borderBottom: "1px solid var(--rule)",
          background: "var(--paper)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <a className="mono" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "underline" }}>
              ← Propostas
            </a>
            <span style={{ color: "var(--muted-2)" }}>/</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>p_8a91</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
            <div>
              <Eyebrow style={{ marginBottom: 8 }}>Proposta · Suplementex Brasil</Eyebrow>
              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em" }}>
                Carla Bezerra
              </h1>
              <div style={{ display: "flex", gap: 24, marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
                <span className="mono">carla@suplementex.com.br</span>
                <span style={{ color: "var(--rule)" }}>·</span>
                <span className="mono">criada · 08 mai 2026 · 14:09</span>
                <span style={{ color: "var(--rule)" }}>·</span>
                <span className="mono">sessão · b3f9c4a2</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <StatusBadge status="pending_review" />
              <button className="oa-btn ghost sm">Ver entrevista ↗</button>
            </div>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 0,
        }}>
          {/* LEFT COLUMN */}
          <div style={{
            padding: "32px 40px 64px",
            borderRight: "1px solid var(--rule)",
          }}>
            {/* SECTION 2 — PIPELINE STATUS */}
            <Section
              eyebrow="01 · Pipeline"
              title="Status do processamento"
              right={<button className="oa-btn ghost sm">Reprocessar pipeline</button>}
            >
              <div className="oa-card" style={{ padding: "20px 24px" }}>
                <PipelineSteps />
              </div>
            </Section>

            {/* SECTION 3 — EDITABLE DATA */}
            <Section
              eyebrow="02 · Dados editáveis"
              title="Ajuste antes de gerar os documentos"
              right={
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--ok)" }}>● salvo · há 2 min</span>
                  <button className="oa-btn sm">Salvar alterações</button>
                </div>
              }
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <EditableField label="Preço total (R$)">
                  <input className="oa-input" defaultValue="184.500,00" style={{ fontSize: 18 }} />
                </EditableField>
                <EditableField label="Prazo total (dias úteis)">
                  <input className="oa-input" defaultValue="68" style={{ fontSize: 18 }} />
                </EditableField>
              </div>
              <EditableField label="Notas internas (não aparecem no documento)" style={{ marginTop: 14 }}>
                <textarea
                  className="oa-input"
                  rows={3}
                  defaultValue="Cliente sinalizou orçamento até R$ 200k. Negociar prazo agressivo: tentar entregar fase 1 em 30 dias para validação A/B no Black Friday."
                  style={{ fontFamily: "var(--sans)", fontSize: 13.5, lineHeight: 1.5, resize: "vertical" }}
                />
              </EditableField>
            </Section>

            {/* SECTION 6 — Generated content (accordion) */}
            <Section eyebrow="05 · Auditoria" title="Conteúdo gerado pelo pipeline">
              <div className="oa-card">
                <div style={{
                  display: "flex", borderBottom: "1px solid var(--rule)",
                  background: "var(--paper-2)",
                }}>
                  {[
                    { k: "discovery", label: "Discovery Summary" },
                    { k: "pricing",   label: "Pricing Summary" },
                    { k: "phases",    label: "Phases Plan" },
                    { k: "meta",      label: "Proposal Metadata" },
                  ].map((t) => (
                    <button key={t.k}
                      onClick={() => setTab(t.k)}
                      style={{
                        padding: "12px 18px", border: 0, background: "transparent",
                        fontSize: 12, fontFamily: "var(--mono)",
                        color: tab === t.k ? "var(--ink)" : "var(--muted)",
                        borderBottom: tab === t.k ? "2px solid var(--accent)" : "2px solid transparent",
                        marginBottom: -1, cursor: "pointer", textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}>{t.label}</button>
                  ))}
                </div>
                <pre style={{
                  margin: 0, padding: "18px 22px",
                  fontSize: 12.5, lineHeight: 1.65,
                  fontFamily: "var(--mono)",
                  color: "var(--ink-2)",
                  whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto",
                  background: "var(--paper)",
                }}>{auditContent[tab]}</pre>
              </div>
            </Section>
          </div>

          {/* RIGHT COLUMN — sticky-ish actions */}
          <div style={{
            padding: "32px 32px 64px",
            background: "var(--paper-2)",
            display: "flex", flexDirection: "column", gap: 28,
          }}>
            {/* SECTION 4 — DOCUMENTS */}
            <Aside title="Documentos" eyebrow="03 · Geração">
              <DocRow
                fmt="DOCX"
                label="Proposta-Suplementex.docx"
                meta="324 KB · gerado há 8 min"
                ready
              />
              <DocRow
                fmt="PDF"
                label="Proposta-Suplementex.pdf"
                meta="generating"
                generating
              />
              <div style={{
                marginTop: 12, padding: "10px 12px",
                background: "var(--warn-soft)",
                borderLeft: "2px solid var(--warn)",
                fontSize: 12, color: "oklch(0.40 0.10 80)", lineHeight: 1.5,
              }}>
                Documentos refletem os dados salvos. Se você editar preço ou prazo, gere novamente.
              </div>
            </Aside>

            {/* SECTION 5 — SEND */}
            <Aside title="Envio ao cliente" eyebrow="04 · Aprovação">
              <div style={{
                padding: "14px 16px",
                background: "var(--paper)",
                border: "1px solid var(--rule)",
                fontSize: 13,
              }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Destinatário</div>
                <div className="mono" style={{ fontSize: 13 }}>carla@suplementex.com.br</div>
                <div className="eyebrow" style={{ marginBottom: 6, marginTop: 12 }}>Anexos</div>
                <div className="mono" style={{ fontSize: 13 }}>1 DOCX · 1 PDF</div>
              </div>

              <button className="oa-btn accent" style={{ width: "100%", padding: "13px" }}>
                Enviar proposta por email
                <span style={{ fontSize: 14 }}>→</span>
              </button>
              <button className="oa-btn ghost sm" style={{ width: "100%" }}>
                Marcar como rejeitada
              </button>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
                pedirá confirmação antes do disparo
              </div>
            </Aside>

            {/* TIMELINE */}
            <Aside title="Linha do tempo" eyebrow="histórico">
              <Timeline />
            </Aside>
          </div>
        </div>
      </div>
    </div>
  );
}

// helpers --------------------------------------------------

function Section({ eyebrow, title, right, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        marginBottom: 14,
      }}>
        <div>
          <Eyebrow style={{ marginBottom: 4 }}>{eyebrow}</Eyebrow>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}>{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Aside({ eyebrow, title, children }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <Eyebrow style={{ marginBottom: 2 }}>{eyebrow}</Eyebrow>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function EditableField({ label, children, style }) {
  return (
    <div style={style}>
      <Eyebrow style={{ marginBottom: 6 }}>{label}</Eyebrow>
      {children}
    </div>
  );
}

function PipelineSteps() {
  const steps = [
    { k: "Discovery gerado",     state: "done", ts: "14:09:12" },
    { k: "Pricing gerado",       state: "done", ts: "14:11:48" },
    { k: "Phases gerado",        state: "done", ts: "14:14:02" },
    { k: "Proposta gerada",      state: "done", ts: "14:15:33" },
    { k: "Aguardando revisão",   state: "current", ts: "agora" },
  ];
  return (
    <div>
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        const sym = s.state === "done" ? "✓" : s.state === "error" ? "✕" : "•";
        const color =
          s.state === "done"    ? "var(--ok)" :
          s.state === "error"   ? "var(--danger)" :
          s.state === "current" ? "var(--accent)" : "var(--rule)";
        return (
          <div key={i} style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 2,
                background: s.state === "current" ? "var(--accent)" : (s.state === "done" ? "var(--ok-soft)" : "var(--paper-2)"),
                color: s.state === "current" ? "white" : color,
                display: "grid", placeItems: "center",
                fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600,
              }}>{sym}</div>
              {!isLast && <div style={{ flex: 1, width: 1, background: "var(--rule)", margin: "2px 0" }} />}
            </div>
            <div style={{
              flex: 1, paddingBottom: isLast ? 0 : 18,
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
            }}>
              <div style={{
                fontSize: 14, fontWeight: s.state === "current" ? 500 : 400,
                color: s.state === "pending" ? "var(--muted-2)" : "var(--ink)",
              }}>{s.k}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{s.ts}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DocRow({ fmt, label, meta, ready, generating }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px",
      border: "1px solid var(--rule)",
      background: "var(--paper)",
    }}>
      <div style={{
        width: 38, height: 44, flexShrink: 0,
        background: ready ? "var(--ink)" : "var(--paper-2)",
        color: ready ? "var(--paper)" : "var(--muted)",
        border: ready ? "none" : "1px solid var(--rule)",
        display: "grid", placeItems: "center",
        fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
        letterSpacing: "0.05em",
      }}>{fmt}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {ready ? label : `Proposta-Suplementex.${fmt.toLowerCase()}`}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
          {generating ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 8, height: 8, border: "1.5px solid var(--accent)",
                borderRadius: "50%", borderTopColor: "transparent",
                animation: "oaSpin 0.8s linear infinite",
                display: "inline-block",
              }} />
              gerando…
            </span>
          ) : meta}
        </div>
      </div>
      {ready ? (
        <button className="oa-btn ghost sm">Baixar ↓</button>
      ) : (
        <button className="oa-btn ghost sm" disabled>Gerar</button>
      )}
    </div>
  );
}

function Timeline() {
  const events = [
    { ts: "14:15", t: "Pipeline concluído",        kind: "ok" },
    { ts: "14:09", t: "Cliente aprovou discovery", kind: "info" },
    { ts: "14:08", t: "Resumo apresentado",        kind: "info" },
    { ts: "13:54", t: "Entrevista iniciada",       kind: "info" },
    { ts: "13:52", t: "Código ARC-2026-038 usado", kind: "info" },
  ];
  return (
    <div style={{
      background: "var(--paper)",
      border: "1px solid var(--rule)",
      padding: "8px 0",
    }}>
      {events.map((e, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 10,
          padding: "8px 14px",
          fontSize: 12.5, alignItems: "center",
        }}>
          <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>{e.ts}</span>
          <span style={{ color: "var(--ink-2)" }}>{e.t}</span>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: e.kind === "ok" ? "var(--ok)" : "var(--muted-2)",
          }} />
        </div>
      ))}
    </div>
  );
}

const auditContent = {
  discovery: `{
  "client": "Suplementex Brasil",
  "contact": "Carla Bezerra <carla@suplementex.com.br>",
  "problem": "Alta taxa de abandono no checkout (71%) em loja de suplementos.",
  "hypotheses": [
    "UX do checkout em mobile",
    "Performance LCP > 4.2s no fluxo /cart → /checkout",
    "Falha intermitente no gateway de pagamento"
  ],
  "current_metrics": {
    "abandonment_rate_pct": 71,
    "monthly_attempts": 18000,
    "monthly_revenue_brl": 320000
  },
  "goal": {
    "metric": "abandonment_rate_pct",
    "target": 45,
    "deadline_days": 90
  },
  "stack": ["Shopify Plus", "checkout customizado", "Cielo (gateway)"],
  "constraints": ["sem downtime", "preservar integração com gateway atual"]
}`,
  pricing: `// PRICING SUMMARY
total_brl: 184500.00
breakdown:
  - discovery_técnico:        18.000  (3 dias)
  - design_ux_checkout:       42.500  (10 dias)
  - implementação:            89.000  (28 dias)
  - testes_a/b + métricas:    24.000  (12 dias)
  - acompanhamento_30d:       11.000  (15 dias)
margem_operacional_pct: 22
risco_buffer_pct: 8`,
  phases: `Fase 1 — Diagnóstico  · 08 mai → 14 mai (5d)
  • Análise heurística do checkout mobile
  • Audit de performance (Lighthouse + WebVitals)
  • Replay de sessões abandonadas (Hotjar)

Fase 2 — Design  · 15 mai → 30 mai (12d)
  • Wireframes de novo fluxo checkout
  • Hi-fi + protótipo clicável
  • Validação com 6 usuários

Fase 3 — Implementação  · 02 jun → 30 jun (21d)
  • Refactor do checkout customizado
  • A/B test setup (Optimize)
  • Hardening do gateway

Fase 4 — Acompanhamento  · 01 jul → 31 jul
  • Monitoria diária por 30 dias
  • Relatório quinzenal de KPIs`,
  meta: `proposal_id: p_8a91
session_id: b3f9c4a2-c5d8-41a9-91be-e5f4c7d1
generated_by: pipeline@worker-3
generated_at: 2026-05-08T17:15:33Z
template_version: proposal-template@2.4.1
documents:
  docx: { generated_at: "2026-05-08T17:42:01Z", bytes: 331776 }
  pdf:  { state: "generating" }
audit_trail: 14 events`,
};

window.ScreenProposalDetail = ScreenProposalDetail;
