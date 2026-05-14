import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    litellm_model: str = "groq/llama-3.3-70b-versatile"
    llm_api_key: str = ""

    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "https://us.cloud.langfuse.com"

    supabase_url: str = ""
    supabase_service_role_key: str = ""

    resend_api_key: str = ""
    email_from: str = ""
    email_admin: str = ""

    company_email: str = ""
    company_phone: str = ""
    company_website: str = ""

    max_messages_per_session: int = 40
    max_input_tokens_per_session: int = 20000
    max_file_size_mb: int = 10

    pipeline_secret: str = ""
    cors_origins: str = "http://localhost:3000"

    # Parâmetros comerciais para precificação no agent-pricing
    taxa_hora_desenvolvedor: str = "R$ 150"
    margem_risco_percentual: int = 20  # percentual
    faixa_esforço_baixa: str = "20-30"  # horas (min-max)
    faixa_esforço_media: str = "40-60"
    faixa_esforço_alta: str = "80-120"
    faixa_esforço_muito_alta: str = "150-200"

    def get_parametros_comerciais(self) -> dict:
        """Retorna dict com parâmetros comerciais para o agent-pricing."""
        return {
            "taxa_hora_desenvolvedor": self.taxa_hora_desenvolvedor,
            "margem_risco": f"{self.margem_risco_percentual}%",
            "faixas_esforço": {
                "Baixa": self.faixa_esforço_baixa,
                "Média": self.faixa_esforço_media,
                "Alta": self.faixa_esforço_alta,
                "Muito Alta": self.faixa_esforço_muito_alta,
            }
        }

    def configure_llm_key(self) -> None:
        model = self.litellm_model
        key = self.llm_api_key
        if model.startswith("groq/"):
            os.environ["GROQ_API_KEY"] = key
        elif model.startswith("anthropic/"):
            os.environ["ANTHROPIC_API_KEY"] = key
        elif model.startswith("gemini/"):
            os.environ["GEMINI_API_KEY"] = key
        elif model.startswith("openrouter/"):
            os.environ["OPENROUTER_API_KEY"] = key

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
