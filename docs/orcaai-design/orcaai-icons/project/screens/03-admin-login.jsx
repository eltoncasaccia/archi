/* global React, Logo, Eyebrow, Field */
// =============================================================
// SCREEN 3 — Login do Admin
// route: /admin/login
// =============================================================
function ScreenAdminLogin() {
  return (
    <div className="oa-root" style={{
      width: "100%", height: "100%",
      display: "grid", gridTemplateColumns: "1.1fr 1fr",
      background: "var(--paper)",
    }}>
      {/* form */}
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "40px 64px",
      }}>
        <Logo />

        <div style={{ maxWidth: 380 }}>
          <Eyebrow style={{ marginBottom: 14 }}>Painel Interno</Eyebrow>
          <h1 style={{
            margin: "0 0 8px", fontSize: 30, fontWeight: 500,
            letterSpacing: "-0.02em",
          }}>Portal de Gestão</h1>
          <p style={{ margin: "0 0 32px", color: "var(--muted)", fontSize: 14 }}>
            Acesso restrito a usuários autorizados
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Email">
              <input className="oa-input" type="email" defaultValue="rafael@archi.com.br" style={{ fontFamily: "var(--sans)" }} />
            </Field>

            <Field label="Senha">
              <input className="oa-input" type="password" defaultValue="••••••••••••" style={{ fontFamily: "var(--sans)", letterSpacing: "0.1em" }} />
            </Field>

            <button className="oa-btn" style={{ width: "100%", padding: "13px", marginTop: 4 }}>
              Entrar
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Para novas credenciais, contate o administrador do sistema
        </div>
      </div>

      {/* aside */}
      <div style={{
        background: "var(--paper-2)",
        borderLeft: "1px solid var(--rule)",
        padding: "40px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}>
        <Eyebrow>Status do sistema · 08 mai 2026</Eyebrow>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            { label: "API Discovery", value: "ok", meta: "Latência de resposta (p99) · 184ms" },
            { label: "Agentes de Processamento", value: "ok", meta: "3 ativos" },
            { label: "Processamento de Documentos", value: "ok", meta: "fila · 0" },
            { label: "Email · SES", value: "warn", meta: "throttle leve" },
          ].map((s, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 0",
              borderTop: i === 0 ? "1px solid var(--rule)" : "none",
              borderBottom: "1px solid var(--rule)",
            }}>
              <div>
                <div style={{ fontSize: 14 }}>{s.label}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.meta}</div>
              </div>
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: s.value === "ok" ? "var(--ok)" : "var(--warn)",
                boxShadow: `0 0 0 4px ${s.value === "ok" ? "var(--ok-soft)" : "var(--warn-soft)"}`,
              }} />
            </div>
          ))}
        </div>

        <div className="mono" style={{
          fontSize: 11, color: "var(--muted)",
          display: "flex", justifyContent: "space-between",
        }}>
          <span>build · 1.0.0-rc4</span>
          <span>BR-SP · sa-east-1</span>
        </div>
      </div>
    </div>
  );
}
window.ScreenAdminLogin = ScreenAdminLogin;
