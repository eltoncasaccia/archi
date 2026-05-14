/* global React, Logo, Eyebrow, Field */
const { useState: useState1 } = React;

// =============================================================
// SCREEN 1 — Acesso (cliente)
// route: /
// =============================================================
function ScreenAccess() {
  const [code, setCode] = useState1("");
  const [state, setState] = useState1("idle"); // idle | invalid | used | expired

  const errorCopy = {
    invalid: "Código inválido. Verifique e tente novamente.",
    used:    "Este código já foi utilizado.",
    expired: "Este código expirou. Solicite um novo ao responsável.",
  }[state];

  return (
    <div className="oa-root" style={{
      width: "100%", height: "100%",
      display: "grid", gridTemplateColumns: "1fr 1fr",
      background: "var(--paper)",
    }}>
      {/* LEFT — quote / context panel */}
      <div style={{
        background: "var(--ink)",
        color: "var(--paper)",
        padding: "48px 56px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }}>
        <Logo dark />

        <div>
          <Eyebrow style={{ color: "var(--muted-2)", marginBottom: 24 }}>
            Discovery → Proposta · Automatizado
          </Eyebrow>
          <h2 style={{
            margin: 0, fontSize: 44, lineHeight: 1.05, fontWeight: 400,
            letterSpacing: "-0.025em", maxWidth: 460,
          }}>
            Conte sobre o seu projeto.<br />
            <span style={{ color: "var(--muted-2)" }}>
              Em 15 minutos, devolvemos uma proposta sob medida.
            </span>
          </h2>
        </div>

        <div style={{
          display: "flex", gap: 32, fontSize: 13, color: "var(--muted-2)",
          fontFamily: "var(--mono)",
        }}>
          <div>
            <div style={{ color: "var(--paper)", fontSize: 22, fontWeight: 400 }}>~15 min</div>
            <div>tempo de conversa</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
          <div>
            <div style={{ color: "var(--paper)", fontSize: 22, fontWeight: 400 }}>1 código</div>
            <div>uso único</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
          <div>
            <div style={{ color: "var(--paper)", fontSize: 22, fontWeight: 400 }}>0 ligações</div>
            <div>sem agendamento</div>
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "48px 80px",
      }}>
        <div style={{ maxWidth: 380, width: "100%" }}>
          <Eyebrow style={{ marginBottom: 16 }}>Acesso · Cliente</Eyebrow>
          <h1 style={{
            margin: "0 0 12px", fontSize: 32, fontWeight: 500,
            letterSpacing: "-0.02em", lineHeight: 1.15,
          }}>
            Bem-vindo.
          </h1>
          <p style={{ margin: "0 0 36px", color: "var(--muted)", fontSize: 15, lineHeight: 1.55 }}>
            Digite o código de acesso enviado pelo responsável do projeto para começar a entrevista.
          </p>

          <Field label="Código de acesso" hint="Letras maiúsculas e hífens. Ex: ARC-2026-042">
            <input
              className="oa-input"
              placeholder="ARC-2026-042"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              style={{
                fontSize: 18, letterSpacing: "0.06em",
                borderColor: state !== "idle" ? "var(--danger)" : undefined,
              }}
            />
          </Field>

          {errorCopy && (
            <div style={{
              marginTop: 12, padding: "10px 12px",
              background: "var(--danger-soft)",
              borderLeft: "2px solid var(--danger)",
              fontSize: 13, color: "oklch(0.42 0.14 25)",
            }}>{errorCopy}</div>
          )}

          <button
            className={`oa-btn accent ${code.length < 3 ? "disabled" : ""}`}
            style={{ width: "100%", marginTop: 24, padding: "14px 16px", fontSize: 15 }}
          >
            Acessar
            <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
          </button>

          <div style={{
            marginTop: 56, paddingTop: 20,
            borderTop: "1px solid var(--rule)",
            fontSize: 12, color: "var(--muted)",
            display: "flex", justifyContent: "space-between",
          }}>
            <span>Sem cadastro · sem senha</span>
            <span className="mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ScreenAccess = ScreenAccess;
