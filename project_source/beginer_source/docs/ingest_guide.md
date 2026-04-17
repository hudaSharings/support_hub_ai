# Ingestion Guide

This beginner project uses a local docs seed corpus generated from documentation URLs.

## How ingestion works
1. Prepare a URL seed file (`src/data/docs_seed_urls.txt`), one URL per line.
2. Run ingestion:
   - CLI: `python3 -m src.app.main --ingest-urls-file src/data/docs_seed_urls.txt`
   - API: `POST /ingest` with `{"urls": ["https://..."]}`
3. `src/rag/corpus_loader.py` fetches pages, strips HTML, and writes `DOCS_STORE_PATH`.
4. `src/rag/chunker.py` splits docs into chunks.
5. `src/rag/indexer.py` builds a Chroma vector index using sentence-transformer embeddings.
6. `src/rag/retriever.py` performs semantic similarity retrieval and returns top evidence chunks with citation metadata.

## Citation fields
Every retrieved evidence item includes:
- `source_url`
- `chunk_id`
- `excerpt`
- `relevance_score`
