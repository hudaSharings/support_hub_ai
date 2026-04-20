from collections import defaultdict
import re


def _normalize_excerpt(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def retrieve_evidence(query: str, vector_store, top_k: int = 3) -> list[dict]:
    # Retrieve a wider set first, then apply diversity + dedupe.
    candidate_k = max(top_k * 6, 12)
    hits = vector_store.similarity_search_with_relevance_scores(query, k=candidate_k)

    selected: list[dict] = []
    seen_keys: set[str] = set()
    per_source_count: dict[str, int] = defaultdict(int)
    max_per_source = 1 if top_k <= 3 else 2

    for doc, score in hits:
        source_url = doc.metadata.get("source_url", "unknown")
        chunk_id = doc.metadata.get("chunk_id", "na")
        excerpt = doc.page_content
        normalized_excerpt = _normalize_excerpt(excerpt)

        # Hard dedupe for repeated/near-identical chunks.
        key = f"{source_url}::{normalized_excerpt}"
        if key in seen_keys:
            continue

        # Encourage source diversity in top-k evidence.
        if per_source_count[source_url] >= max_per_source:
            continue

        selected.append(
            {
                "source_url": source_url,
                "chunk_id": chunk_id,
                "excerpt": excerpt,
                "relevance_score": float(score),
            }
        )
        seen_keys.add(key)
        per_source_count[source_url] += 1

        if len(selected) >= top_k:
            break

    # Fallback: if diversity constraints were too strict, fill up from remaining unique chunks.
    if len(selected) < top_k:
        for doc, score in hits:
            source_url = doc.metadata.get("source_url", "unknown")
            chunk_id = doc.metadata.get("chunk_id", "na")
            excerpt = doc.page_content
            normalized_excerpt = _normalize_excerpt(excerpt)
            key = f"{source_url}::{normalized_excerpt}"
            if key in seen_keys:
                continue
            selected.append(
                {
                    "source_url": source_url,
                    "chunk_id": chunk_id,
                    "excerpt": excerpt,
                    "relevance_score": float(score),
                }
            )
            seen_keys.add(key)
            if len(selected) >= top_k:
                break

    return selected
