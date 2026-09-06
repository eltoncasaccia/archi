#!/usr/bin/env python3
"""Archi — eval de prompts, camada 1: montagem.

Checa os prompts em archi-prompts/ contra os casos em prompt.tests.yaml SEM
chamar LLM: é determinístico, instantâneo e de graça, então pode rodar a cada
commit. Valida o contrato entre o prompt e quem o chama — que é onde moravam
os bugs de setembro/2026 (nenhuma variável era substituída, e o modelo recebia
os placeholders literais).

A camada 2 — qualidade da saída, com LLM e critério de julgamento — é outra
coisa e depende de discoveries reais e de faixas de preço aceitáveis.

Uso:  make eval        (ou: uv run --directory archi-api python scripts/eval_prompts.py)
Saída: 0 = tudo passou | 1 = há falhas
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "archi-api"))

try:
    import yaml
except ImportError:
    sys.exit("PyYAML indisponível. Rode via 'make eval' (usa o ambiente do archi-api).")

from app.services.prompt_loader import _UNFILLED_VAR_RE, render_prompt

GREEN, RED, YELLOW, DIM, BOLD, NC = (
    "\033[0;32m", "\033[0;31m", "\033[1;33m", "\033[0;90m", "\033[1m", "\033[0m"
)

PROMPTS_DIR = ROOT / "archi-prompts"


def declared_vars(template: str) -> set[str]:
    """Variáveis que o prompt espera receber."""
    return set(_UNFILLED_VAR_RE.findall(template))


def check_case(template: str, case: dict) -> list[str]:
    """Roda as checagens de um caso. Devolve a lista de falhas (vazia = passou)."""
    failures: list[str] = []
    inputs = case.get("inputs") or {}
    expected = case.get("expect_contains") or []

    declared = declared_vars(template)
    provided = set(inputs)

    # O caso cobre todas as variáveis do prompt?
    if missing := declared - provided:
        failures.append(
            "o caso não fornece variáveis que o prompt declara: " + ", ".join(sorted(missing))
        )

    # O caso fornece variável que o prompt não usa mais? (prompt renomeado, teste não)
    if extra := provided - declared:
        failures.append(
            "o caso fornece variáveis que o prompt não declara: " + ", ".join(sorted(extra))
        )

    rendered, leftover = render_prompt(template, **{k: str(v) for k, v in inputs.items()})

    # Nenhum placeholder pode sobrar — é o bug que o modelo recebia literal.
    if leftover:
        failures.append("placeholders não preenchidos no prompt montado: " + ", ".join(leftover))

    for text in expected:
        if text not in rendered:
            failures.append(f"expect_contains ausente: {text!r}")

    return failures


def main() -> int:
    if not PROMPTS_DIR.is_dir():
        sys.exit(f"archi-prompts/ não encontrado em {PROMPTS_DIR}")

    print(f"{BOLD}Archi — eval de prompts{NC}  {DIM}camada 1: montagem, sem LLM{NC}\n")

    total = passed = 0
    agents = sorted(PROMPTS_DIR.glob("agent-*"))
    if not agents:
        sys.exit("nenhum agente encontrado em archi-prompts/")

    for agent_dir in agents:
        for version_dir in sorted(agent_dir.glob("v*")):
            prompt_file = version_dir / "prompt.yaml"
            tests_file = version_dir / "prompt.tests.yaml"

            if not prompt_file.is_file():
                continue

            print(f"{BOLD}{agent_dir.name}{NC} {DIM}{version_dir.name}{NC}")

            if not tests_file.is_file():
                print(f"  {YELLOW}!{NC} sem prompt.tests.yaml — nenhum caso para rodar\n")
                continue

            template = (yaml.safe_load(prompt_file.read_text()) or {}).get("template")
            if not template:
                print(f"  {RED}✗{NC} prompt.yaml sem campo 'template'\n")
                total += 1
                continue

            cases = (yaml.safe_load(tests_file.read_text()) or {}).get("cases") or []
            if not cases:
                print(f"  {YELLOW}!{NC} prompt.tests.yaml sem casos\n")
                continue

            for case in cases:
                total += 1
                name = case.get("name", "<sem nome>")
                failures = check_case(template, case)
                if failures:
                    print(f"  {RED}✗{NC} {name}")
                    for f in failures:
                        print(f"      {DIM}→ {f}{NC}")
                else:
                    passed += 1
                    n = len(case.get("expect_contains") or [])
                    print(f"  {GREEN}✓{NC} {name}{DIM}  {n} asserções{NC}")
            print()

    failed = total - passed
    if failed == 0:
        print(f"{GREEN}{BOLD}{total} casos, todos passaram.{NC}")
    else:
        print(f"{RED}{BOLD}{failed} de {total} casos falharam.{NC}")
        print(f"{DIM}Falha aqui significa que prompt e teste divergiram — decida qual dos dois{NC}")
        print(f"{DIM}está certo antes de rodar 'make sync-prompts'.{NC}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
