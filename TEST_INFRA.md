# E2E Test Infra: Gigxomi Chat & Permissions Architecture

## Test Philosophy
- Opaque-box, requirement-driven. Derived strictly from `ORIGINAL_REQUEST.md` and user-facing security specifications.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Interaction Testing + Real-World Agency Scenarios.
- Strict isolation: All tests must run locally via Node test runner (`node --test`), completely isolated from the production PostgreSQL database and live conversations (`DATABASE_URL=""`).

## Feature Inventory & Test Coverage
| # | Feature | Source (Requirement) | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|----------------------|:----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | Private Chat Stripping (R1) | ORIGINAL_REQUEST §R1; docx §5 | 5 | 5 | ✓ | ✓ |
| 2 | Summary & Unread Isolation (R1) | ORIGINAL_REQUEST §R1; docx §5 | 5 | 5 | ✓ | ✓ |
| 3 | Read vs Send Decoupling (R2) | ORIGINAL_REQUEST §R2; docx §6 | 5 | 5 | ✓ | ✓ |
| 4 | Non-Destructive Removal (R3) | ORIGINAL_REQUEST §R3; docx §8 | 5 | 5 | ✓ | ✓ |
| 5 | Centralized Capability Resolver (R4) | ORIGINAL_REQUEST §R4; docx §13 | 5 | 5 | ✓ | ✓ |
| 6 | Push Notification Privacy (R1, R3) | ORIGINAL_REQUEST §R1, R3; docx §5 | 5 | 5 | ✓ | ✓ |
| 7 | Realtime Event Isolation (R1, R3) | ORIGINAL_REQUEST §R1, R3 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: Node native test runner (`node --test`)
- Test Suite Location: `tests/chat-permissions-e2e.test.mjs`
- Test Assertions: Node `node:assert/strict`
- Pass/Fail Semantics: Process exit code 0 on pass, non-zero on failure
- Mocking & Isolation: Pure in-memory state manipulation using cloned test conversation fixtures; zero external network or database calls.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Private Rate Negotiation & Public Delivery: Admin sets private budget in customer lane; editor reads client instructions and posts delivery in internal lane without seeing budget | F1, F2, F3, F5 | High |
| 2 | Editor Client-Chat Toggle Lifecycle: Editor begins with client-chat disabled (read-only); agency enables client chat for revision discussion; editor sends reply; agency locks again | F3, F5, F6 | Medium |
| 3 | Reassignment & Complete History Audit: Editor A completes 10 tasks then is removed; audit log recorded; Editor B assigned as primary; 100% of history, media, and payments verified intact | F4, F5, F7 | High |
| 4 | Rapid Push & Realtime Security: Admin sends burst of customer messages including 1 private message; pushes and realtime events broadcast to customer and admin, zero to editor | F1, F6, F7 | Medium |
| 5 | Read-Only Collaborator vs Primary Editor: Primary editor can reply internally; collaborator has read-only view; both view customer instructions; private messages stripped for both | F1, F3, F4, F5 | High |

## Coverage Thresholds
- Tier 1: ≥35 test cases (≥5 per feature across 7 core areas)
- Tier 2: ≥35 test cases (boundary and error condition cases)
- Tier 3: ≥10 pairwise interaction test cases
- Tier 4: ≥5 realistic multi-step workflow scenarios
- **Total Suite Minimum**: ≥85 test cases in `tests/chat-permissions-e2e.test.mjs`
