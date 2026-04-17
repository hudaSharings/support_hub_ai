from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, ValidationError

from src.app.config import settings
from src.domain.models import SupportCaseInput
from src.rag.corpus_loader import ingest_urls
from src.workflow.case_resolution import resolve_case

app = FastAPI(title="Beginner Support AI API", version="0.1.0")


class IngestRequest(BaseModel):
    urls: list[str] = Field(default_factory=list)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/resolve")
def resolve(payload: dict) -> dict:
    try:
        case = SupportCaseInput(**payload)
    except (TypeError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid request payload: {exc}") from exc

    output = resolve_case(case)
    response = output.model_dump(mode="json")
    return response


@app.post("/ingest")
def ingest(payload: IngestRequest) -> dict:
    if not payload.urls:
        raise HTTPException(status_code=400, detail="urls must not be empty.")
    return ingest_urls(payload.urls, settings.docs_store_path)
