/* global React, AdminSidebar, Eyebrow, Badge, StatusBadge, fmtBRL */
const { useState: useState6 } = React;

// preview page metadata — keeps the right rail in sync with the left page nav
const previewPages = [
  { n: 1, label: "Capa" },
  { n: 2, label: "Sumário executivo" },
  { n: 3, label: "Escopo & Fases" },
  { n: 4, label: "Investimento" },
  { n: 5, label: "Termos" },
];

// =============================================================
// SCREEN 6 — Detalhe da Proposta
// route: /admin/proposals/[id]
// =============================================================
function ScreenProposalDetail() {
  const [tab, setTab] = useState6("discovery");
  const [previewFmt, setPreviewFmt] = useState6("pdf");
  const [previewPage, setPreviewPage] = useState6(1);
  const [zoom, setZoom] = useState6(100);

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

            {/* SECTION — EDITABLE DATA */}
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

            {/* SECTION — DOCUMENT PREVIEW */}
            <Section
              eyebrow="Preview"
              title="Como o cliente vai ver"
              right={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    display: "inline-flex", padding: 2,
                    background: "var(--paper-2)", border: "1px solid var(--rule)",
                    borderRadius: 2,
                  }}>
                    {["pdf", "docx"].map((f) => (
                      <button key={f}
                        onClick={() => setPreviewFmt(f)}
                        style={{
                          padding: "5px 12px", border: 0,
                          background: previewFmt === f ? "var(--ink)" : "transparent",
                          color: previewFmt === f ? "var(--paper)" : "var(--muted)",
                          fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500,
                          letterSpacing: "0.06em", textTransform: "uppercase",
                          cursor: "pointer", borderRadius: 1,
                        }}>{f}</button>
                    ))}
                  </div>
                  <button className="oa-btn ghost sm">Abrir em tela cheia ↗</button>
                </div>
              }
            >
              <div style={{
                border: "1px solid var(--rule)",
                background: "var(--paper-2)",
                display: "grid",
                gridTemplateColumns: "180px 1fr",
              }}>
                {/* PAGES RAIL */}
                <div style={{
                  borderRight: "1px solid var(--rule)",
                  padding: "16px 12px",
                  background: "var(--paper)",
                  display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div className="eyebrow" style={{ padding: "0 6px 4px" }}>
                    {previewPages.length} páginas
                  </div>
                  {previewPages.map((p) => {
                    const active = previewPage === p.n;
                    return (
                      <button key={p.n}
                        onClick={() => setPreviewPage(p.n)}
                        style={{
                          display: "flex", gap: 10, alignItems: "center",
                          padding: "8px 8px",
                          border: 0, borderRadius: 2,
                          background: active ? "var(--accent-soft)" : "transparent",
                          cursor: "pointer", textAlign: "left",
                        }}>
                        <PageThumb n={p.n} active={active} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="mono" style={{
                            fontSize: 10, color: active ? "var(--accent-ink)" : "var(--muted)",
                          }}>P{String(p.n).padStart(2, "0")}</div>
                          <div style={{
                            fontSize: 12,
                            color: active ? "var(--ink)" : "var(--ink-2)",
                            fontWeight: active ? 500 : 400,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{p.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* PREVIEW STAGE */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--rule)",
                    background: "var(--paper)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        onClick={() => setPreviewPage(Math.max(1, previewPage - 1))}
                        disabled={previewPage === 1}
                        className="oa-btn ghost sm"
                        style={{ padding: "4px 10px", opacity: previewPage === 1 ? 0.4 : 1 }}
                      >←</button>
                      <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)", minWidth: 64, textAlign: "center" }}>
                        {String(previewPage).padStart(2, "0")} / {String(previewPages.length).padStart(2, "0")}
                      </span>
                      <button
                        onClick={() => setPreviewPage(Math.min(previewPages.length, previewPage + 1))}
                        disabled={previewPage === previewPages.length}
                        className="oa-btn ghost sm"
                        style={{ padding: "4px 10px", opacity: previewPage === previewPages.length ? 0.4 : 1 }}
                      >→</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                        {previewFmt.toUpperCase()} · A4 · sincroniza com edição
                      </span>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid var(--rule)", borderRadius: 2 }}>
                        <button
                          onClick={() => setZoom(Math.max(60, zoom - 10))}
                          style={{ padding: "3px 9px", border: 0, background: "transparent", cursor: "pointer", fontFamily: "var(--mono)", color: "var(--ink)" }}
                        >−</button>
                        <span className="mono" style={{ fontSize: 11, color: "var(--ink-2)", minWidth: 36, textAlign: "center" }}>{zoom}%</span>
                        <button
                          onClick={() => setZoom(Math.min(160, zoom + 10))}
                          style={{ padding: "3px 9px", border: 0, background: "transparent", cursor: "pointer", fontFamily: "var(--mono)", color: "var(--ink)" }}
                        >+</button>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: "28px 0",
                    background: "var(--paper-3)",
                    backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                    display: "grid", placeItems: "start center",
                    minHeight: 540,
                    overflow: "hidden",
                  }}>
                    <div style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top center",
                      transition: "transform 0.18s ease",
                    }}>
                      <DocumentPage page={previewPage} />
                    </div>
                  </div>

                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px",
                    borderTop: "1px solid var(--rule)",
                    background: "var(--paper)",
                    fontSize: 11,
                  }}>
                    <span className="mono" style={{ color: "var(--muted)" }}>
                      preview · live · reflete dados salvos
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ok)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)" }} />
                      <span className="mono" style={{ letterSpacing: "0.04em" }}>sincronizado</span>
                    </span>
                  </div>
                </div>
              </div>
            </Section>

            {/* SECTION — Generated content (accordion) */}
            <Section eyebrow="06 · Auditoria" title="Conteúdo gerado pelo pipeline">
              <div className="oa-card">
                <div style={{
                  display: "flex", borderBottom: "1px solid var(--rule)",
                  background: "var(--paper-2)",
                }}>
                  {[
                    { k: "discovery", label: "Discovery Summary" },
                    { k: "pricing", label: "Pricing Summary" },
                    { k: "phases", label: "Phases Plan" },
                    { k: "meta", label: "Proposal Metadata" },
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
            <Aside title="Documentos" eyebrow="04 · Geração">
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
            <Aside title="Envio ao cliente" eyebrow="05 · Aprovação">
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

// =============================================================
// DOCUMENT PREVIEW — paper-rendered pages
// =============================================================

function PageThumb({ n, active }) {
  // tiny abstract preview of each page's layout
  const lines = {
    1: [["H", 60], ["S", 40], [], [], ["T", 70]],
    2: [["E", 30], ["T", 90], ["t", 80], ["t", 85], [], ["t", 70]],
    3: [["E", 30], ["T", 80], ["b", 70], ["b", 65], ["b", 75], ["b", 60]],
    4: [["E", 30], ["T", 70], ["r", 90], ["r", 90], ["r", 90], ["TOT", 100]],
    5: [["E", 30], ["T", 60], ["t", 90], ["t", 80], ["t", 70], ["sig", 50]],
  }[n] || [];

  return (
    <div style={{
      width: 30, height: 42, flexShrink: 0,
      background: "var(--paper)",
      border: `1px solid ${active ? "var(--accent)" : "var(--rule)"}`,
      padding: "4px 3px",
      display: "flex", flexDirection: "column", gap: 1.5,
      boxShadow: active ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
    }}>
      {lines.map((l, i) => {
        if (l.length === 0) return <div key={i} style={{ height: 2 }} />;
        const [kind, w] = l;
        const h = kind === "H" ? 4 : kind === "T" ? 2.5 : kind === "TOT" ? 3 : kind === "E" ? 1.5 : 1.5;
        const bg = kind === "TOT" ? "var(--accent)" : kind === "H" ? "var(--ink)" : kind === "E" ? "var(--accent)" : "var(--rule-2)";
        return <div key={i} style={{ height: h, width: `${w}%`, background: bg }} />;
      })}
    </div>
  );
}

// A "page" rendered at 420×594 (A4 ratio, ~1:1.414). Inside uses serif body
// styling to read as the printed doc — distinct from the app chrome.
function DocumentPage({ page }) {
  const W = 460, H = 650;
  return (
    <div style={{
      width: W, height: H,
      background: "white",
      boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 18px 38px -16px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.05)",
      position: "relative",
      fontFamily: "Georgia, 'Times New Roman', serif",
      color: "#1a1612",
      overflow: "hidden",
    }}>
      {page === 1 && <PageCover />}
      {page === 2 && <PageSummary />}
      {page === 3 && <PagePhases />}
      {page === 4 && <PagePricing />}
      {page === 5 && <PageTerms />}

      {/* page number footer */}
      {page > 1 && (
        <div style={{
          position: "absolute", left: 36, right: 36, bottom: 22,
          display: "flex", justifyContent: "space-between",
          fontFamily: "Geist Mono, monospace",
          fontSize: 9, color: "#9a8f80", letterSpacing: "0.08em",
        }}>
          <span>ARCHI · PROPOSTA P_8A91</span>
          <span>{String(page).padStart(2, "0")} / 05</span>
        </div>
      )}
    </div>
  );
}

// Page 1 — Cover
function PageCover() {
  return (
    <div style={{
      width: "100%", height: "100%", padding: "44px 40px",
      display: "flex", flexDirection: "column",
      background:
        "linear-gradient(180deg, #faf7f0 0%, #faf7f0 55%, #15110d 55%, #15110d 100%)",
    }}>
      {/* archi mark */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#15110d" }}>
        <svg width="20" height="20" viewBox="0 0 22 22">
          <path d="M3 11 C 3 6, 7 3, 11 3 C 15 3, 19 6, 19 11 C 19 16, 15 19, 11 19 C 9 19, 7 18, 6 17 L 3 18 L 4.5 15 C 3.5 14, 3 12.5, 3 11 Z" fill="#15110d" />
          <circle cx="13.5" cy="9.5" r="1.2" fill="#faf7f0" />
        </svg>
        <span style={{ fontFamily: "Geist, sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: "-0.02em" }}>
          Arch<span style={{ color: "oklch(0.62 0.16 45)" }}>i</span>
        </span>
      </div>

      <div style={{ marginTop: 36 }}>
        <div style={{
          fontFamily: "Geist Mono, monospace", fontSize: 10,
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: "#6b6259", marginBottom: 14,
        }}>Proposta Comercial · 08 Mai 2026</div>

        <div style={{
          fontSize: 38, lineHeight: 1.05, fontWeight: 400,
          letterSpacing: "-0.02em",
        }}>
          Redução de abandono<br />
          no checkout mobile.
        </div>

        <div style={{ marginTop: 28, fontSize: 13, lineHeight: 1.6, color: "#3a3128", maxWidth: 320 }}>
          Diagnóstico, redesenho e implementação do fluxo de checkout
          para a Suplementex Brasil em 68 dias úteis.
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* bottom dark block */}
      <div style={{ color: "#faf7f0", paddingTop: 28 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28,
          fontFamily: "Geist, sans-serif",
        }}>
          <div>
            <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 9, letterSpacing: "0.18em", color: "#948a7d", textTransform: "uppercase", marginBottom: 6 }}>Preparado para</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Carla Bezerra</div>
            <div style={{ fontSize: 12, color: "#c8bfa9" }}>Suplementex Brasil</div>
          </div>
          <div>
            <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 9, letterSpacing: "0.18em", color: "#948a7d", textTransform: "uppercase", marginBottom: 6 }}>Investimento</div>
            <div style={{ fontSize: 18, fontWeight: 500, fontFamily: "Geist Mono, monospace" }}>R$ 184.500</div>
            <div style={{ fontSize: 12, color: "#c8bfa9" }}>68 dias úteis · 4 fases</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageEyebrow({ children }) {
  return (
    <div style={{
      fontFamily: "Geist Mono, monospace", fontSize: 10,
      letterSpacing: "0.18em", textTransform: "uppercase",
      color: "oklch(0.62 0.16 45)",
    }}>{children}</div>
  );
}

function PageTitle({ children }) {
  return (
    <h2 style={{
      margin: "8px 0 18px",
      fontSize: 24, fontWeight: 400, letterSpacing: "-0.015em",
      lineHeight: 1.15,
    }}>{children}</h2>
  );
}

// Page 2 — executive summary
function PageSummary() {
  return (
    <div style={{ padding: "44px 40px 48px" }}>
      <PageEyebrow>01 · Sumário Executivo</PageEyebrow>
      <PageTitle>O que vamos resolver.</PageTitle>

      <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "#2b251d", margin: "0 0 14px" }}>
        A Suplementex registra <strong>71% de abandono</strong> no checkout em
        dispositivos móveis sobre uma base mensal de <strong>18.000 tentativas</strong>.
        Em três meses, propomos reduzir essa taxa para 45%, recuperando
        receita estimada de R$ 87.000/mês.
      </p>

      <div style={{
        margin: "22px 0",
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        borderTop: "1px solid #d9d2bf", borderBottom: "1px solid #d9d2bf",
      }}>
        {[
          { k: "Hoje", v: "71%", s: "abandono" },
          { k: "Meta 90d", v: "≤ 45%", s: "abandono" },
          { k: "Impacto", v: "+R$ 87k", s: "receita/mês" },
        ].map((m, i) => (
          <div key={i} style={{
            padding: "16px 14px",
            borderLeft: i > 0 ? "1px solid #d9d2bf" : "none",
          }}>
            <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 9, letterSpacing: "0.14em", color: "#6b6259", textTransform: "uppercase" }}>{m.k}</div>
            <div style={{ fontFamily: "Geist, sans-serif", fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 6 }}>{m.v}</div>
            <div style={{ fontSize: 11, color: "#6b6259", marginTop: 2 }}>{m.s}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, margin: "18px 0 8px", letterSpacing: "-0.01em" }}>Hipóteses do diagnóstico</h3>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: "#2b251d" }}>
        <li>UX do checkout em mobile — fricção excessiva entre carrinho e pagamento.</li>
        <li>Performance LCP {">"} 4.2s no fluxo /cart → /checkout.</li>
        <li>Falha intermitente no gateway de pagamento (Cielo).</li>
      </ul>

      <h3 style={{ fontSize: 13, fontWeight: 600, margin: "18px 0 8px", letterSpacing: "-0.01em" }}>Restrições</h3>
      <p style={{ fontSize: 12, lineHeight: 1.65, color: "#2b251d", margin: 0 }}>
        Sem janela de downtime. Integração com gateway atual preservada.
        Stack: Shopify Plus + checkout customizado.
      </p>
    </div>
  );
}

// Page 3 — phases
function PagePhases() {
  const phases = [
    { f: "01", t: "Diagnóstico", d: "5 dias úteis", w: "08–14 mai", desc: "Análise heurística + audit de performance + replay de sessões abandonadas." },
    { f: "02", t: "Design", d: "12 dias úteis", w: "15–30 mai", desc: "Wireframes do novo checkout, hi-fi clicável e validação com 6 usuários." },
    { f: "03", t: "Implementação", d: "21 dias úteis", w: "02–30 jun", desc: "Refactor do checkout, setup de A/B test e hardening do gateway." },
    { f: "04", t: "Acompanhamento", d: "30 dias úteis", w: "01–31 jul", desc: "Monitoria diária e relatório quinzenal de KPIs." },
  ];
  return (
    <div style={{ padding: "44px 40px 48px" }}>
      <PageEyebrow>02 · Escopo & Fases</PageEyebrow>
      <PageTitle>68 dias úteis, em 4 fases.</PageTitle>

      <div style={{ marginTop: 12 }}>
        {phases.map((p, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "40px 1fr",
            gap: 14,
            padding: "16px 0",
            borderTop: i === 0 ? "1px solid #d9d2bf" : "none",
            borderBottom: "1px solid #d9d2bf",
          }}>
            <div style={{
              fontFamily: "Geist Mono, monospace", fontSize: 18,
              color: "oklch(0.62 0.16 45)", fontWeight: 500, letterSpacing: "-0.02em",
            }}>{p.f}</div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 500, fontFamily: "Geist, sans-serif", letterSpacing: "-0.01em" }}>{p.t}</div>
                <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, color: "#6b6259" }}>{p.w} · {p.d}</div>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: "#3a3128" }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Page 4 — pricing
function PagePricing() {
  const rows = [
    { k: "Discovery técnico", d: "3 d", v: "R$ 18.000" },
    { k: "Design UX do checkout", d: "10 d", v: "R$ 42.500" },
    { k: "Implementação", d: "28 d", v: "R$ 89.000" },
    { k: "Testes A/B + métricas", d: "12 d", v: "R$ 24.000" },
    { k: "Acompanhamento (30 dias)", d: "15 d", v: "R$ 11.000" },
  ];
  return (
    <div style={{ padding: "44px 40px 48px" }}>
      <PageEyebrow>03 · Investimento</PageEyebrow>
      <PageTitle>Detalhamento por entregável.</PageTitle>

      <div style={{ marginTop: 16, borderTop: "1.5px solid #15110d" }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1fr 60px 110px",
            padding: "14px 0", borderBottom: "1px solid #e8e2d1",
            fontSize: 12.5, alignItems: "baseline",
          }}>
            <div style={{ fontFamily: "Geist, sans-serif", color: "#15110d" }}>{r.k}</div>
            <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: "#6b6259", textAlign: "right" }}>{r.d}</div>
            <div style={{ fontFamily: "Geist Mono, monospace", textAlign: "right", color: "#15110d" }}>{r.v}</div>
          </div>
        ))}
      </div>

      {/* total */}
      <div style={{
        marginTop: 18,
        padding: "20px 22px",
        background: "#15110d", color: "#faf7f0",
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <div>
          <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, letterSpacing: "0.18em", color: "#c8bfa9", textTransform: "uppercase" }}>Total</div>
          <div style={{ fontFamily: "Geist, sans-serif", fontSize: 11, marginTop: 4, color: "#c8bfa9" }}>68 dias úteis · pagamento em 3x</div>
        </div>
        <div style={{
          fontFamily: "Geist Mono, monospace", fontSize: 30,
          fontWeight: 500, letterSpacing: "-0.02em",
        }}>R$ 184.500</div>
      </div>

      <p style={{
        marginTop: 22, fontSize: 11, lineHeight: 1.6,
        color: "#6b6259", fontStyle: "italic",
      }}>
        Valores válidos por 30 dias a partir da data de emissão.
        Inclui margem operacional e buffer de risco. Sem custos adicionais por horas extraordinárias dentro do escopo acordado.
      </p>
    </div>
  );
}

// Page 5 — terms + signature
function PageTerms() {
  return (
    <div style={{ padding: "44px 40px 48px" }}>
      <PageEyebrow>04 · Termos & Aceite</PageEyebrow>
      <PageTitle>Condições gerais.</PageTitle>

      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.75, color: "#2b251d" }}>
        <li><strong>Pagamento.</strong> Em 3 parcelas: 40% na assinatura, 30% no início da Fase 3, 30% na entrega final.</li>
        <li><strong>Propriedade intelectual.</strong> Todo o código produzido é transferido para a contratante ao fim do projeto.</li>
        <li><strong>Confidencialidade.</strong> NDA mútuo válido por 24 meses após o encerramento.</li>
        <li><strong>Cancelamento.</strong> Pode ser solicitado a qualquer momento, com pagamento das horas executadas até a data.</li>
      </ol>

      <div style={{
        marginTop: 40, paddingTop: 28,
        borderTop: "1px solid #d9d2bf",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32,
      }}>
        <div>
          <div style={{ height: 36, borderBottom: "1px solid #15110d" }} />
          <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 9, letterSpacing: "0.14em", color: "#6b6259", textTransform: "uppercase", marginTop: 6 }}>Pela contratante</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Carla Bezerra · Suplementex</div>
        </div>
        <div>
          <div style={{
            height: 36,
            borderBottom: "1px solid #15110d",
            display: "flex", alignItems: "flex-end",
            fontFamily: "'Brush Script MT', cursive",
            fontSize: 22,
            color: "#15110d",
            paddingBottom: 2,
          }}>Rafael Mendes</div>
          <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 9, letterSpacing: "0.14em", color: "#6b6259", textTransform: "uppercase", marginTop: 6 }}>Pela Archi</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Rafael Mendes · Sócio fundador</div>
        </div>
      </div>
    </div>
  );
}

function PipelineSteps() {
  const steps = [
    { k: "Discovery gerado", state: "done", ts: "14:09:12" },
    { k: "Pricing gerado", state: "done", ts: "14:11:48" },
    { k: "Phases gerado", state: "done", ts: "14:14:02" },
    { k: "Proposta gerada", state: "done", ts: "14:15:33" },
    { k: "Aguardando revisão", state: "current", ts: "agora" },
  ];
  return (
    <div>
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        const sym = s.state === "done" ? "✓" : s.state === "error" ? "✕" : "•";
        const color =
          s.state === "done" ? "var(--ok)" :
            s.state === "error" ? "var(--danger)" :
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
    { ts: "14:15", t: "Pipeline concluído", kind: "ok" },
    { ts: "14:09", t: "Cliente aprovou discovery", kind: "info" },
    { ts: "14:08", t: "Resumo apresentado", kind: "info" },
    { ts: "13:54", t: "Entrevista iniciada", kind: "info" },
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
