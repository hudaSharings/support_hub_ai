import argparse
import json
from dataclasses import asdict

from src.domain.models import SupportCaseInput
from src.graph.workflow import run_workflow
from src.persistence.repositories.case_repository import CaseRepository


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--health", action="store_true")
    parser.add_argument("--demo", action="store_true")
    args = parser.parse_args()

    if args.health:
        print("ok")
        return

    if args.demo:
        repository = CaseRepository()
        case = SupportCaseInput(
            case_id="STD-DEMO-1",
            title="API calls failing for org automation",
            description="Multiple API failures observed in CI jobs.",
            org_id="org-standard-demo",
        )
        repository.save_case(case)
        resolved = run_workflow(case)
        print(json.dumps(asdict(resolved), indent=2))
        return

    parser.print_help()


if __name__ == "__main__":
    main()
