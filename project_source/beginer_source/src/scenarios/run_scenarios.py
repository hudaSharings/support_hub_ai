import json
from pathlib import Path

from src.domain.models import SupportCaseInput
from src.workflow.case_resolution import resolve_case
from src.evaluation.validators import validate_output
from src.app.config import settings


def run_all_scenarios(fixtures_dir: str = "src/scenarios/fixtures") -> dict:
    fixture_root = Path(fixtures_dir)
    if not fixture_root.is_absolute():
        fixture_root = Path(__file__).resolve().parent / "fixtures"
    fixture_paths = sorted(fixture_root.glob("scenario_*.json"))

    out_dir = Path(settings.scenario_output_dir)
    if not out_dir.is_absolute():
        out_dir = Path(__file__).resolve().parents[2] / "docs" / "scenario_outputs"
    out_dir.mkdir(parents=True, exist_ok=True)

    summary = {"total": len(fixture_paths), "passed": 0, "failed": 0, "details": []}

    for path in fixture_paths:
        payload = json.loads(path.read_text())
        case = SupportCaseInput(**payload)
        result = resolve_case(case)
        result_dict = result.model_dump(mode="json")

        status = "passed"
        error = ""
        try:
            validate_output(result_dict)
            summary["passed"] += 1
        except Exception as ex:
            status = "failed"
            error = str(ex)
            summary["failed"] += 1

        (out_dir / f"{path.stem}_output.json").write_text(json.dumps(result_dict, indent=2))
        summary["details"].append({"scenario": path.stem, "status": status, "error": error, "decision": result_dict["decision"]})

    _write_summary_report(out_dir, summary)
    return summary


def _write_summary_report(out_dir: Path, summary: dict) -> None:
    lines = [
        "# Scenario Summary Report",
        "",
        f"- Total scenarios: {summary['total']}",
        f"- Passed: {summary['passed']}",
        f"- Failed: {summary['failed']}",
        "",
        "## Scenario Status",
    ]
    for item in summary["details"]:
        line = f"- {item['scenario']}: {item['status']} (decision={item['decision']})"
        if item["error"]:
            line += f" - error: {item['error']}"
        lines.append(line)
    (out_dir / "summary_report.md").write_text("\n".join(lines) + "\n")
