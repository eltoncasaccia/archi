/* global React, Logo, Eyebrow */
// =============================================================
// SCREEN 2 — Entrevista (cliente · chat)
// route: /interview/[sessionId]
// =============================================================

const interviewMessages = [
  { from: "agent", time: "14:02", text: "Olá! Sou o agente de discovery da Archi. Vou fazer algumas perguntas para entender o seu projeto e, ao final, te entrego um resumo para aprovação. Combinado?" },
  { from: "user",  time: "14:03", text: "Combinado, pode começar." },
  { from: "agent", time: "14:03", text: "Perfeito. Para começar — em uma frase, qual é o problema que você quer resolver com este projeto?" },
  { from: "user",  time: "14:04", text: "Tenho uma loja online de suplementos e o checkout está com taxa de abandono altíssima. Suspeito que seja UX, mas também pode ser performance no mobile." },
  { from: "agent", time: "14:05", text: "Entendi. Vamos por partes. Você tem algum número da taxa de abandono atual e do volume mensal de tentativas de checkout?" },
  { from: "user",  time: "14:07", text: "Abandono está em 71% e temos cerca de 18 mil tentativas/mês. Faturamento batido fica em torno de R$ 320 mil." },
  { from: "agent", time: "14:08", text: "Ótimos números para trabalharmos. Última pergunta antes de fechar o resumo: qual é o prazo ideal para ver isso resolvido em produção?" },
  // streaming agent message — last
  { from: "agent", time: "14:09", text: "Perfeito. Com base na nossa conversa, aqui está o resumo do discovery:\n\n• **Problema** — alta taxa de abandono no checkout (71%) em loja de suplementos, com hipóteses entre UX e performance mobile.\n• **Volume** — 18.000 tentativas/mês, faturamento atual ≈ R$ 320 mil.\n• **Objetivo** — reduzir abandono para ≤45% em até 90 dias.\n• **Stack** — Shopify Plus + checkout customizado.\n• **Restrições** — não pode haver downtime; integração com gateway atual deve ser preservada.\n\nSe estiver tudo correto, podemos confirmar e gerar a proposta.", isApproval: true },
];

function ScreenInterview() {
  return (
    <div className="oa-root" style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      background: "var(--paper)",
    }}>
      {/* HEADER */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 28px",
        borderBottom: "1px solid var(--rule)",
        background: "var(--paper)",
      }}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted)" }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--ok)", boxShadow: "0 0 0 3px var(--ok-soft)",
            }} />
            <span>Conectado</span>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted-2)" }}>
            sess · b3f9c4a2
          </div>
        </div>
      </header>

      {/* CHAT BODY */}
      <main style={{
        flex: 1, overflow: "hidden",
        display: "flex", flexDirection: "column",
        alignItems: "center",
      }}>
        <div style={{
          flex: 1, width: "100%", maxWidth: 720,
          padding: "32px 24px 16px",
          overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 18,
        }}>
          {/* date marker */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            margin: "4px 0 8px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
            <span className="eyebrow">Hoje · 14:02</span>
            <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
          </div>

          {interviewMessages.map((m, i) => <Bubble key={i} m={m} />)}

          {/* approval CTA — sits below the last agent bubble */}
          <div style={{
            alignSelf: "flex-start",
            marginLeft: 44, marginTop: -4,
            display: "flex", gap: 10,
          }}>
            <button className="oa-btn accent">
              Confirmar e gerar proposta
              <span style={{ fontSize: 14 }}>→</span>
            </button>
            <button className="oa-btn ghost">Quero ajustar algo</button>
          </div>

          {/* typing indicator — preview of streaming UI */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginTop: 8 }}>
            <Avatar role="agent" />
            <div style={{
              padding: "10px 14px",
              background: "var(--paper-2)",
              border: "1px solid var(--rule)",
              borderRadius: 2, borderTopLeftRadius: 0,
              display: "flex", gap: 4, alignItems: "center",
            }}>
              <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
              <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>digitando</span>
            </div>
          </div>
        </div>

        {/* COMPOSER */}
        <div style={{
          width: "100%", maxWidth: 720,
          padding: "12px 24px 28px",
        }}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 10,
            background: "var(--paper)",
            border: "1px solid var(--rule)",
            borderRadius: 2,
            padding: 8,
          }}>
            <textarea
              placeholder="Escreva sua resposta…"
              defaultValue=""
              rows={1}
              style={{
                flex: 1, resize: "none", border: 0, outline: 0,
                background: "transparent", padding: "10px 12px",
                fontSize: 15, color: "var(--ink)", fontFamily: "var(--sans)",
                lineHeight: 1.5,
              }}
            />
            <button className="oa-btn accent sm" style={{ padding: "10px 14px" }}>
              Enviar
              <span style={{ fontSize: 13 }}>↵</span>
            </button>
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginTop: 8, fontSize: 11, color: "var(--muted-2)",
          }}>
            <span>Enter para enviar · Shift+Enter para nova linha</span>
            <span className="mono">criptografado</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function Avatar({ role }) {
  const isAgent = role === "agent";
  return (
    <div style={{
      width: 32, height: 32, flexShrink: 0,
      borderRadius: 2,
      background: isAgent ? "var(--ink)" : "var(--paper-3)",
      color: isAgent ? "var(--paper)" : "var(--ink)",
      display: "grid", placeItems: "center",
      fontFamily: "var(--mono)",
      fontSize: 11, fontWeight: 500,
    }}>
      {isAgent ? "AI" : "VC"}
    </div>
  );
}

function Bubble({ m }) {
  const isAgent = m.from === "agent";
  // simple markdown-ish rendering for **bold** and bullets
  const renderText = (t) => t.split("\n").map((line, i) => {
    const isBullet = line.trim().startsWith("•");
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : p
    );
    return (
      <div key={i} style={{
        marginTop: i > 0 ? (isBullet ? 4 : 10) : 0,
        paddingLeft: isBullet ? 0 : 0,
      }}>{parts}</div>
    );
  });

  return (
    <div style={{
      display: "flex", gap: 12,
      flexDirection: isAgent ? "row" : "row-reverse",
      alignItems: "flex-end",
    }}>
      <Avatar role={m.from} />
      <div style={{ maxWidth: "78%" }}>
        <div style={{
          padding: m.isApproval ? "16px 18px" : "10px 14px",
          background: isAgent ? "var(--paper-2)" : "var(--ink)",
          color: isAgent ? "var(--ink)" : "var(--paper)",
          border: isAgent ? "1px solid var(--rule)" : "1px solid var(--ink)",
          borderRadius: 2,
          borderTopLeftRadius: isAgent ? 0 : 2,
          borderTopRightRadius: isAgent ? 2 : 0,
          fontSize: 14.5, lineHeight: 1.55,
          letterSpacing: "-0.005em",
        }}>
          {m.isApproval && (
            <div className="eyebrow" style={{
              color: "var(--muted)", marginBottom: 10,
            }}>Resumo do Discovery</div>
          )}
          {renderText(m.text)}
        </div>
        <div style={{
          fontSize: 11, color: "var(--muted-2)", marginTop: 4,
          textAlign: isAgent ? "left" : "right",
          fontFamily: "var(--mono)",
        }}>{m.time}</div>
      </div>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span style={{
      width: 5, height: 5, borderRadius: "50%",
      background: "var(--muted)",
      animation: `oaDot 1.2s ${delay}ms infinite ease-in-out`,
      display: "inline-block",
      margin: "0 1px",
    }} />
  );
}

window.ScreenInterview = ScreenInterview;
