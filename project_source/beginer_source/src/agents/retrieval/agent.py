from src.app.config import settings
from src.domain.models import SupportGraphState
from src.rag.chunker import chunk_docs
from src.rag.corpus_loader import load_corpus
from src.rag.indexer import build_vector_index
from src.rag.retriever import retrieve_evidence

_VECTOR_STORE = None


def gather_docs_evidence(state: SupportGraphState) -> SupportGraphState:
    global _VECTOR_STORE
    corpus = load_corpus(settings.docs_store_path)
    chunks = chunk_docs(corpus)
    if _VECTOR_STORE is None:
        _VECTOR_STORE = build_vector_index(
            chunks=chunks,
            persist_directory=settings.vector_db_path,
            embedding_model=settings.embedding_model,
        )
    query = f"{state.case_input.title} {state.case_input.description}"
    state.docs_evidence = retrieve_evidence(query, _VECTOR_STORE, top_k=3)
    return state
