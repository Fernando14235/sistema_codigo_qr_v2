---
name: architecture-review
description: High-level architectural audit focusing on modularity, dependency direction, coupling, and system-wide patterns.
---

# Technical Architecture Review

## Scope Definition (MANDATORY)

Define the macro scope of the audit. This skill is intended for structural analysis, not local logic.

1. **System Layer**: Backend, Frontend, or both.
2. **Modules/Packages**: Specific business domains (e.g., `VisitManagement`, `UserAuth`).
3. **Cross-cutting concerns**: Connectivity, Event systems, Shared utilities.

---

# Audit Dimensions

## 1. Modularity & Boundaries

Evaluate how the system is partitioned.

- **Encapsulation**: Does code from Module A directly access internal classes of Module B?
- **Public API**: Is there a clear entry point for each module/layer?
- **Circular Dependencies**: Are there illegal import loops between major components?

## 2. Dependency Direction (Clean Architecture)

Verify the flow of control and dependencies.

- **Core Stability**: Do high-level business rules depend on low-level infrastructure (DB, API clients)? (Should be the reverse).
- **Abstractions**: Are interfaces used to decouple implementation details?

## 3. Coupling & Cohesion

- **Afferent/Efferent Coupling**: Are some modules carrying too many dependencies?
- **Single Responsibility Principle (SRP)**: Do classes/services have a single reason to change at an architectural level?

## 4. Pattern Consistency

- **Standardization**: Are we following the same patterns (Repository, Factory, Observer) consistently across the project?
- **Anti-patterns**: Use of "God Objects", Singletons for state management, or bypasses of established layers.

---

# What this skill does NOT review (Avoid overlap)

- **Functional Logic**: Specific business rule correctness (Use `backend-code-review`).
- **Persistence**: Query optimization or schema (Use `data-layer-review`).
- **UI/UX**: Component internal logic (Use `frontend-structure-review`).

---

# Mandatory Output Format

## 1. Architectural Health Map

Visualization of the module connections and dependency direction.

## 2. Structural Violations

List of "breaks" in the defined architecture (e.g., "Controller directly using DB Driver").

## 3. Stability Index

Assessment of how easy it is to change the system without breaking unrelated parts.

## 4. Proposed Refactoring Path

A high-level strategy to migrate towards a cleaner structure.
