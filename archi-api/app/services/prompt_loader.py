import json
import logging
import re
from pathlib import Path

from langfuse import Langfuse

from app.config import settings

logger = logging.getLogger(__name__)

PROMPT_NAMES = [
    "agent-discovery-interview",
    "agent-discovery-generator",
    "agent-pricing",
    "agent-phases",
    "agent-proposal-generator",
]

# prompts_cache.json fica na raiz de archi-api/
CACHE_FILE = Path(__file__).parent.parent.parent / "prompts_cache.json"

# Variáveis de prompt são snake_case entre chaves simples: {discovery_summary}.
# Os placeholders do template do documento usam chaves duplas e MAIÚSCULAS
# ({{PRECO_TOTAL}}), e ficam de fora deste padrão de propósito — quem preenche
# aqueles é o agent-proposal-generator, não o carregador.
_UNFILLED_VAR_RE = re.compile(r"(?<!\{)\{([a-z_][a-z0-9_]*)\}(?!\})")

_prompts: dict[str, str] = {}


async def load_prompts() -> None:
    global _prompts
    try:
        _prompts = _fetch_from_langfuse()
        CACHE_FILE.write_text(json.dumps(_prompts, ensure_ascii=False, indent=2))
        logger.info("Prompts carregados do LangFuse e cache atualizado.")
    except Exception as e:
        logger.warning(f"LangFuse indisponível ({e}). Carregando do cache local.")
        if not CACHE_FILE.exists():
            raise RuntimeError(
                "LangFuse indisponível e prompts_cache.json não encontrado. "
                "Execute com LangFuse rodando ao menos uma vez para criar o cache."
            )
        _prompts = json.loads(CACHE_FILE.read_text())
        logger.info("Prompts carregados do cache local.")


def _fetch_from_langfuse() -> dict[str, str]:
    langfuse = Langfuse(
        public_key=settings.langfuse_public_key,
        secret_key=settings.langfuse_secret_key,
        host=settings.langfuse_host,
    )
    prompts = {}
    for name in PROMPT_NAMES:
        prompt = langfuse.get_prompt(name)
        prompts[name] = prompt.prompt
    langfuse.flush()
    return prompts


def render_prompt(text: str, **variables: str) -> tuple[str, list[str]]:
    """Preenche as variáveis {nome} de um prompt. Devolve (texto, não_preenchidas).

    Substituição literal (str.replace), não str.format: os prompts contêm chaves
    duplas do template do documento — {{PRECO_TOTAL}}, {{NOME_CLIENTE}} — que o
    format quebraria.

    Função pura, sem estado: é o que `scripts/eval_prompts.py` usa para checar os
    YAMLs antes de publicar. Assim o eval exercita o mesmo código que a produção,
    em vez de uma reimplementação que pode divergir.
    """
    for key, value in variables.items():
        text = text.replace("{" + key + "}", value if value is not None else "")
    return text, sorted(set(_UNFILLED_VAR_RE.findall(text)))


def get_prompt(name: str, **variables: str) -> str:
    """Retorna o prompt carregado, com as variáveis preenchidas.

    Variável declarada no prompt e não passada aqui chega literal ao modelo, que
    passa a ler a própria instrução com um placeholder no lugar do conteúdo.
    Por isso o log avisa: é sempre erro de call site, nunca comportamento desejado.
    """
    if name not in _prompts:
        raise KeyError(f"Prompt '{name}' não encontrado. Verifique o LangFuse.")

    text, leftover = render_prompt(_prompts[name], **variables)
    if leftover:
        logger.warning(
            "Prompt '%s' enviado com variáveis não preenchidas: %s",
            name, ", ".join(leftover),
        )
    return text
