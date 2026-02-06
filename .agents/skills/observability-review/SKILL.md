---
name: observability-review
description: Audits production readiness, logging quality, error centralization, and system resilience.
---

# Observability & Production Readiness Review

## Scope Definition (MANDATORY)

Identify the operational boundary under review.

1.  **Logging Infra**: Structured logging implementation, log rotation, ingestion.
2.  **Error Handling Centralization**: Sentry/Datadog integration, Global exception handlers.
3.  **Stability Points**: Health checks, retries, circuit breakers, timeout policies.

---

# Audit Dimensions

## 1. Logging Strategy & Data Privacy

Evaluate the quality and safety of system logs.

- **Structured Logging**: Are logs in JSON or raw text? (Searchable logs require structure).
- **PII Leakage**: Are we logging emails, passwords, QR codes, or internal user IDs in plain text?
- **Log Levels**: Correct use of `DEBUG`, `INFO`, `WARN`, `ERROR`. Is production too noisy or silent?

## 2. Global Error Centralization

- **Exception Mapping**: Does the system use a global handler to catch unhandled rejections?
- **Context Availability**: Do error reports include request IDs, user IDs, and stack traces?
- **Silent Failures**: Detecting `try/catch` blocks that swallow errors without logging or reporting.

## 3. Resilience & Failure Containment

- **Retry Policies**: Are external calls (e.g., mailer, payment API) using exponential backoff?
- **Timeouts**: Are there blocking calls without timeouts that could hang the entire process?
- **Health Checks**: Existence of endpoints for orchestration (Kubernetes/Docker) to detect dead processes.

## 4. Security Audit Trail

- **Action Logging**: Are security-sensitive actions (Role changes, login attempts, QR manually validated) logged in an immutable audit trail?
- **Traceability**: Can a single request be traced from Frontend through all Backend services using a Correlation ID?

---

# Severity Classification

- **CRITICAL**: Sensitive data leak (PII) in logs or total lack of unhandled exception tracking.
- **HIGH**: Silent failures on critical business logic or lack of audit trail for sensitive actions.
- **MEDIUM**: Unstructured logs or missing timeouts in external integrations.
- **LOW**: Inconsistent log levels or minor missing context in error reports.

---

# What this skill does NOT review (Avoid overlap)

- **Business Correctness**: Does the logic work? (Use `backend-code-review`).
- **UI Structure**: React/Frontend architecture (Use `frontend-structure-review`).
- **Token Security**: JWT crypto (Use `token-expiration-check`).
- **Data Layer**: SQL/Index performance (Use `data-layer-review`).

---

# When to use/not use

- **USE when**: Preparing for production deployment or auditing system stability.
- **DO NOT USE when**: Reviewing frontend CSS or local business logic changes.

---

# Mandatory Output Format

## 1. Observability Maturity Gaps

Ranked list of missing operational links.

## 2. Risk Assessment Table

| Operational Risk | Impact | Recommended Action |
| ---------------- | ------ | ------------------ |
| [PII Leak]       | HIGH   | ...                |
| [No Retries]     | MEDIUM | ...                |

## 3. Stability Baseline

Assessment of timeouts, retries, and health checks coverage.

## 4. Hardening Roadmap

Immediate fixes for production readiness and long-term instrumentation plan.
