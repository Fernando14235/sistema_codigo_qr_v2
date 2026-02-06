---
name: backend-code-review
description: Focused technical review of backend logic, functional correctness, clean code patterns, and local error handling.
---

# Backend Code Review: Logic & Correctness

## Scope Definition (MANDATORY)

Identify the specific code units under review (Functions, Classes, or specific Files).
The reviewer must isolate the **business logic** from the underlying infrastructure.

**Mandatory context:**

1. Files affected.
2. Business objective of the code.
3. Local dependencies.

---

# Audit Dimensions

## 1. Functional Logic & Business Rules

Verify if the code actually achieves the intended business goal without side effects.

- **Edge Case Analysis**: Are nulls, empty strings, or zero values handled?
- **Logic Branching**: Are all `if/else` paths valid and reachable?
- **Output Consistency**: Does it return what the caller expects in all scenarios?

## 2. Clean Code & Maintainability

Evaluate the "health" of the code for future developers.

- **Naming**: Are variables/functions descriptive or generic? (Avoid `data`, `process`, `temp`).
- **Complexity**: Is the function too long or deeply nested? (Cyclomatic complexity).
- **Redundancy (DRY)**: Is there logic that should be abstracted?
- **Declarative vs Imperative**: Is the code easy to read at a glance?

## 3. Robust Error Handling (Local)

Focus on how the code fails.

- **Graceful Failure**: Does one small failure crash the entire process?
- **Specific Catching**: Are we catching `Error` (bad) or specific exceptions (good)?
- **Status Codes**: Are HTTP codes (400, 422, 500) mapped correctly to the logic error?
- **Logging**: Are enough details logged to debug, without leaking PII?

## 4. Input Integrity

Review the boundary where data enters the logic.

- **Type Safety**: Are types enforced (TypeScript or runtime checks)?
- **Sanitization**: Is the input cleaned before manipulation?
- **Constraint Enforcement**: Are min/max, required fields, and formats validated?

---

# What this skill does NOT review (Avoid overlap)

- **Architecture**: Do not review layer separation or dependency direction (Use `architecture-review`).
- **Persistence**: Do not review SQL queries, N+1, or transaction logic (Use `data-layer-review`).
- **Security/Auth**: Do not review JWTs or Roles (Use `auth-security-audit`).

---

# Mandatory Output Format

## 1. Logic Integrity Score [0-10]

Quick assessment of how likely this code is to fail in production.

## 2. Functional Flaws

Detailed list of logic bugs or missing edge cases.

## 3. Debt & Maintainability

Specific naming or complexity issues with suggested refactors.

## 4. Error Handling Audit

Assessment of the failure modes and logging strategy.
