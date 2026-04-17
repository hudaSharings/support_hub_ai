from dataclasses import dataclass
import os


@dataclass
class Settings:
    llm_provider: str = os.getenv("LLM_PROVIDER", "groq")
    llm_model: str = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    llm_api_base_url: str = os.getenv("LLM_API_BASE_URL", "https://api.groq.com/openai/v1")
    llm_chat_completions_path: str = os.getenv("LLM_CHAT_COMPLETIONS_PATH", "/chat/completions")
    mcp_server_url: str = os.getenv("MCP_SERVER_URL", "")
    docs_store_path: str = os.getenv("DOCS_STORE_PATH", "src/data/docs_corpus.json")
    vector_db_path: str = os.getenv("VECTOR_DB_PATH", "src/data/vector_db")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    scenario_output_dir: str = os.getenv("SCENARIO_OUTPUT_DIR", "docs/scenario_outputs")


settings = Settings()
