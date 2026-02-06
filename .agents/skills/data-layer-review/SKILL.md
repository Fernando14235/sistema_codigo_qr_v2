---
name: data-layer-review
description: Technical audit of the persistence layer, including schema design, query optimization, and data integrity.
---

# Data Layer & Persistence Review

## Scope Definition (MANDATORY)

Identify the data access components.

1. **Schemas/Models**: SQL definitions, ORM models.
2. **Data Access Objects**: Repositories, Services with DB logic.
3. **Storage Strategy**: Primary DB, Cache (Redis), File storage.

---

# Audit Dimensions

## 1. Schema Lifecycle & Integrity

Evaluate how data is structured.

- **Normalization**: Are we avoiding redundant data? Are relationships (One-to-Many, Many-to-Many) correctly mapped?
- **Constraints**: Use of Foreign Keys, Not-null, and Unique constraints at the DB level.
- **Migrations**: Is there a clear, version-controlled path for schema changes?

## 2. Query Efficiency & Performance

Review how the application interacts with the DB.

- **N+1 Logic**: Detecting loops that perform a DB call per iteration.
- **Indexing**: Are identifying or filtered columns indexed? Are there unnecessary indexes?
- **Execution Plain Analysis**: (If data available) Are we performing sequential scans on large tables?

## 3. Transaction Management

- **Atomicity**: Are multi-step writes wrapped in transactions?
- **Isolation Levels**: Is the application sensitive to race conditions on concurrent writes?
- **Locking Strategies**: Use of pessimistic vs optimistic locking for sensitive resources (e.g., QR validation).

## 4. Connection & Resource Handling

- **Pool Management**: Are connections being released?
- **Unbounded Queries**: Are there queries without `LIMIT` that could fetch millions of rows?

---

# What this skill does NOT review (Avoid overlap)

- **Business Logic**: Formatting or transforming data for the UI (Use `backend-code-review`).
- **Authorization**: Who can see what data (Use `auth-security-audit`).

---

# Mandatory Output Format

## 1. Persistence Health Check

Summary of the data layer maturity.

## 2. Critical Query Violations

List of N+1 risks or missing indexes found.

## 3. Integrity Audit

Assessment of the DB-level constraints and relationship mapping.

## 4. Optimization Recommendations

Specific SQL or ORM changes to improve performance.
