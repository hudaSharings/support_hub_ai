def retrieve_docs(query: str) -> list[dict]:
    return [
        {
            "source_url": "https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api",
            "chunk_id": "std::chunk::1",
            "excerpt": f"Standard mock retrieval for query: {query[:80]}",
            "relevance_score": 0.92,
        }
    ]
