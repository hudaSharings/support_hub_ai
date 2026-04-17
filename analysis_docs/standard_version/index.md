# Standard Version - Document Index

This folder contains the **production-style version** of the design, while still being teachable for beginners.

## Read Order
1. [`STANDARD_PROJECT_PLAN.md`](./STANDARD_PROJECT_PLAN.md)
2. [`STANDARD_HLD.md`](./STANDARD_HLD.md)
3. [`STANDARD_LLD.md`](./STANDARD_LLD.md)
4. [`STANDARD_PHASE_IMPLEMENTATION_GUIDE.md`](./STANDARD_PHASE_IMPLEMENTATION_GUIDE.md)
5. [`STANDARD_HAPPY_PATH_FLOW.md`](./STANDARD_HAPPY_PATH_FLOW.md)
6. [`STANDARD_REQUIREMENTS_TRACEABILITY.md`](./STANDARD_REQUIREMENTS_TRACEABILITY.md)
7. [`STANDARD_OUTPUT_EXAMPLES.md`](./STANDARD_OUTPUT_EXAMPLES.md)

## Scope
- Domain: GitHub.com technical customer support resolution
- Requirements source: [`../../Final_kata.md`](../../Final_kata.md)
- Project package name (pyproject): `tech-customer-support-ai`

## Key Standardization Upgrades
- DB-first design (SQLite + migrations)
- Repository + service + adapter architecture
- API contracts for case intake and resolution output
- Observability, retries, and error taxonomy
- Clear path to production without redesign

## Completion Status
- Requirement traceability: complete
- 8 scenario coverage mapping: complete
- MCP execution path and fallback spec: complete
- RAG quality and citation contract: complete
- Output examples (resolve/clarify/escalate): complete
