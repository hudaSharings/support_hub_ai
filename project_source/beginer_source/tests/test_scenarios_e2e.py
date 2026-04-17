from src.scenarios.run_scenarios import run_all_scenarios


def test_all_scenarios_run_and_validate():
    summary = run_all_scenarios("src/scenarios/fixtures")
    assert summary["total"] == 8
    assert summary["failed"] == 0
