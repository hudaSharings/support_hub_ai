def chunk_docs(docs: list[dict], chunk_size: int = 120) -> list[dict]:
    chunks: list[dict] = []
    for doc in docs:
        content = doc["content"]
        idx = 0
        part = 0
        while idx < len(content):
            excerpt = content[idx : idx + chunk_size]
            chunk_id = f"{doc['title'].replace(' ', '_').lower()}::chunk::{part}"
            chunks.append(
                {
                    "chunk_id": chunk_id,
                    "text": excerpt,
                    "source_url": doc["source_url"],
                    "title": doc["title"],
                }
            )
            idx += chunk_size
            part += 1
    return chunks
