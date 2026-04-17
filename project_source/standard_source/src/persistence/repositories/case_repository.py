from src.domain.models import SupportCaseInput


class CaseRepository:
    """In-memory repository stub; swap with DB implementation later."""

    def __init__(self) -> None:
        self._cases: dict[str, SupportCaseInput] = {}

    def save_case(self, payload: SupportCaseInput) -> None:
        self._cases[payload.case_id] = payload

    def get_case(self, case_id: str) -> SupportCaseInput | None:
        return self._cases.get(case_id)
