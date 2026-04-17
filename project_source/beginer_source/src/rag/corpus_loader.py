from pathlib import Path
import json
import re
from urllib import request


DEFAULT_DOCS = [
    {
        "source_url": "https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api",
        "title": "Rate limits for the REST API",
        "content": "GitHub REST API uses rate limits. Exceeding limits returns throttling responses.",
    },
    {
        "source_url": "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
        "title": "Managing personal access tokens",
        "content": "PAT failures can be caused by permissions, expiration, revocation, or missing organization authorization.",
    },
    {
        "source_url": "https://docs.github.com/en/billing/get-started/how-billing-works",
        "title": "How billing works",
        "content": "Billing status and subscription state can affect feature availability.",
    },
    {
        "source_url": "https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/troubleshooting-saml-authentication",
        "title": "Troubleshooting SAML authentication",
        "content": "SAML issues may require checking certificates, identity provider configuration, and enterprise scope settings.",
    },
]


def load_corpus(corpus_path: str) -> list[dict]:
    path = _resolve_corpus_path(corpus_path)
    if path.exists():
        return json.loads(path.read_text())
    # If the corpus file does not exist, fetch the live docs and save them to the file path
    corpus = _fetch_live_docs(DEFAULT_DOCS)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(corpus, indent=2))
    return corpus


def ingest_urls(urls: list[str], corpus_path: str) -> dict:
    cleaned = [u.strip() for u in urls if u and u.strip()]
    seed_docs = [{"source_url": u, "title": _title_from_url(u), "content": ""} for u in cleaned]
    corpus = _fetch_live_docs(seed_docs)
    path = _resolve_corpus_path(corpus_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(corpus, indent=2))
    return {"written_documents": len(corpus), "corpus_path": str(path)}


def ingest_urls_from_file(urls_file: str, corpus_path: str) -> dict:
    path = Path(urls_file)
    if not path.is_absolute():
        path = Path.cwd() / path
    urls = [line.strip() for line in path.read_text().splitlines() if line.strip() and not line.strip().startswith("#")]
    result = ingest_urls(urls, corpus_path)
    result["source_urls_file"] = str(path)
    return result


def _resolve_corpus_path(corpus_path: str) -> Path:
    path = Path(corpus_path)
    if path.is_absolute():
        return path
    project_root = Path(__file__).resolve().parents[2]
    return project_root / path


def _title_from_url(url: str) -> str:
    slug = url.rstrip("/").split("/")[-1] or "document"
    return slug.replace("-", " ").replace("_", " ").strip().title()


def _fetch_live_docs(seed_docs: list[dict]) -> list[dict]:
    """
    Tries to fetch live docs for realistic ingestion.
    Falls back to seed content if network fetch fails.
    """
    fetched: list[dict] = []
    for doc in seed_docs:
        try:
            req = request.Request(doc["source_url"], headers={"User-Agent": "tech-customer-support-ai"})
            with request.urlopen(req, timeout=10) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
            text = _strip_html(html)
            title = _extract_title(html) or doc["title"]
            content = text[:2000] if text else doc["content"]
            fetched.append({"source_url": doc["source_url"], "title": title, "content": content})
        except Exception:
            fetched.append(doc)
    return fetched


def _strip_html(raw: str) -> str:
    inside = False
    out_chars = []
    for ch in raw:
        if ch == "<":
            inside = True
            continue
        if ch == ">":
            inside = False
            out_chars.append(" ")
            continue
        if not inside:
            out_chars.append(ch)
    return " ".join("".join(out_chars).split())


def _extract_title(raw_html: str) -> str | None:
    match = re.search(r"<title[^>]*>(.*?)</title>", raw_html, re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    title = " ".join(match.group(1).split())
    return title.strip() or None
