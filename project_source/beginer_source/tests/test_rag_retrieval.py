from src.rag.corpus_loader import load_corpus
from src.rag.chunker import chunk_docs
from src.rag.indexer import build_simple_index
from src.rag.retriever import retrieve_evidence


def test_retriever_returns_citation_fields():
    corpus = load_corpus("src/data/docs_corpus.json")
    chunks = chunk_docs(corpus)
    idx = build_simple_index(chunks)
    ev = retrieve_evidence("rate limit api", idx, top_k=1)[0]
    assert "source_url" in ev
    assert "chunk_id" in ev
