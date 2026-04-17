import argparse
import json
from pathlib import Path

from src.app.config import settings
from src.domain.models import SupportCaseInput
from src.rag.corpus_loader import ingest_urls_from_file
from src.workflow.case_resolution import resolve_case
from src.scenarios.run_scenarios import run_all_scenarios


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--health", action="store_true")
    parser.add_argument("--demo", action="store_true")
    parser.add_argument("--run-scenarios", action="store_true")
    parser.add_argument("--case-file", type=str, default="")
    parser.add_argument("--session-id", type=str, default="")
    parser.add_argument("--thread-id", type=str, default="")
    parser.add_argument("--serve-api", action="store_true")
    parser.add_argument("--ingest-urls-file", type=str, default="")
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if args.health:
        print("ok")
        return

    if args.demo:
        case = SupportCaseInput(
            case_id="DEMO-1",
            title="API failing for org automation",
            description="Our scripts are failing with API errors and may be rate-limited.",
            org_id="org-demo",
            session_id=args.session_id or None,
            thread_id=args.thread_id or None,
        )
        output = resolve_case(case)
        print(json.dumps(output.model_dump(mode="json"), indent=2))
        return

    if args.case_file:
        payload = json.loads(Path(args.case_file).read_text())
        if args.session_id:
            payload["session_id"] = args.session_id
        if args.thread_id:
            payload["thread_id"] = args.thread_id
        output = resolve_case(SupportCaseInput(**payload))
        print(json.dumps(output.model_dump(mode="json"), indent=2))
        return

    if args.run_scenarios:
        summary = run_all_scenarios()
        print(json.dumps(summary, indent=2))
        return

    if args.ingest_urls_file:
        summary = ingest_urls_from_file(args.ingest_urls_file, settings.docs_store_path)
        print(json.dumps(summary, indent=2))
        return

    if args.serve_api:
        import uvicorn

        uvicorn.run("src.app.api:app", host=args.host, port=args.port, reload=False)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
