def retrieve_evidence(query: str, vector_store, top_k: int = 3) -> list[dict]:
    hits = vector_store.similarity_search_with_relevance_scores(query, k=top_k)
    return [
        {
            "source_url": doc.metadata.get("source_url", "unknown"),
            "chunk_id": doc.metadata.get("chunk_id", "na"),
            "excerpt": doc.page_content,
            "relevance_score": float(score),
        }
        for doc, score in hits
    ]
