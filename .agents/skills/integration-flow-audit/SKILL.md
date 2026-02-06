---
name: integration-flow-audit
description: Audits cross-layer interactions (FE/BE/Auth/DB), API contract consistency, and end-to-end state transitions.
---

# Integration & Cross-Layer Flow Audit

## Scope Definition (MANDATORY)

Identify the end-to-end flow under review.

1.  **Core Interaction Flow**: E.g., "Resident generates QR -> Visitor validates QR -> Entry recorded".
2.  **Layers Involved**: Frontend (View/State), Gateway/Auth, Backend (Service/Logic), Database (Persistence).
3.  **Third-party Integrations**: External APIs, SMS/Email gateways.

---

# Audit Dimensions

## 1. Flow Integrity & State Safety

Validate the vertical reliability of a complete operation.

- **Transaction Consistency**: Does a failure in the DB roll back the state in the Service layer? Are there orphan records?
- **State Transition Validations**: Can an object transition from State A to State C, skipping a mandatory State B? (e.g., QR used before being issued).
- **Concurrency Risks**: What happens if the same flow is triggered twice simultaneously?

## 2. API Contract & DTO Consistency

Check the "language" used between layers.

- **Payload Mismatch**: Do Frontend interfaces match Backend DTOs exactly?
- **Implicit Types**: Are we relying on "any" or loosely typed objects across the boundary?
- **Breaking Changes**: Does modifying a field in the DB schema break the Frontend view without warning?

## 3. Cross-Layer Authorization Transparency

- **Role Propagation**: Does the Frontend correctly hide UI elements for a role that the Backend also blocks?
- **Bypass Detection**: Can the Frontend state be manipulated to send a valid-looking request for an unauthorized resource?
- **Token Context**: Is the user context correctly propagated through all layers of the flow?

## 4. Error Propagation & User Visibility

- **Failure Feedback**: Does a low-level DB error reach the Frontend as a meaningful message or a generic 500?
- **Async Flow Handling**: How are long-running or async flows handled? Is the user informed of the intermediate state?

---

# Severity Classification

- **CRITICAL**: Broken flows that allow illegal state transitions or result in major data corruption.
- **HIGH**: API contract mismatches that break core functionality or UI-API authorization desync.
- **MEDIUM**: Missing transaction boundaries or poor error propagation.
- **LOW**: Minor type inconsistencies or suboptimal state feedback.

---

# What this skill does NOT review (Avoid overlap)

- **Pure Code Quality**: Local logic cleanliness (Use `backend-code-review`).
- **Database Internals**: Query optimization or local indexing (Use `data-layer-review`).
- **Visuals**: CSS or accessibility issues (Use `frontend-ux-review`).
- **Token Internals**: Encryption algorithms or secret storage (Use `token-expiration-check`).

---

# When to use/not use

- **USE when**: Auditing a feature that spans multiple files and layers (e.g., "Visit Registration").
- **DO NOT USE when**: Reviewing a single function or a single CSS file.

---

# Mandatory Output Format

## 1. Flow Mapping

Sequenced diagram (Mermaid) of the layers and components interacting in the flow.

## 2. Cross-Layer Risk Assessment

Table of identified integration risks.

| Interaction Point | Identified Risk | Severity |
| ----------------- | --------------- | -------- |
| [FE -> API]       | ...             | ...      |
| [API -> Service]  | ...             | ...      |

## 3. Contract Desync Log

Specific fields or types that do not match across boundaries.

## 4. Recommendation Path

High-level refactor to improve flow stability and decoupling.
