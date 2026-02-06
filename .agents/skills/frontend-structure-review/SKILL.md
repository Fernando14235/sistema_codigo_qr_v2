---
name: frontend-structure-review
description: Audit of frontend architecture, component partitioning, state management flow, and hooks usage.
---

# Frontend Structural Review

## Scope Definition (MANDATORY)

Identify the frontend assets under review.

1. **Hierarchy**: Component tree, Routing structure.
2. **State Logic**: Global stores (Redux, Context), Local hooks.
3. **Asset Organization**: Directory structure (Atomic Design, Feature-based).

---

# Audit Dimensions

## 1. Component Responsibility (SFC)

Evaluate how components are partitioned.

- **Dumb vs Smart Components**: Are UI-only components polluted with API calls or business logic?
- **Component Size**: Are there monolithic components (500+ lines) that should be broken down?
- **Prop Drilling**: Is data being passed through too many layers manually?

## 2. State Management Flow

Verify the source of truth and data flow.

- **State Locality**: Is state being stored globally when it should be local to a view?
- **Unnecessary Re-renders**: Are hooks being misused (missing `useMemo`/`useCallback` in critical paths)?
- **Side Effect Handling**: Use of `useEffect`. Are they being cleaned up? Are there synchronization loops?

## 3. Hook Architecture

- **Custom Hooks**: Is logic repeated across components instead of being extracted?
- **Hook Rules**: Are hooks called conditionally?
- **Abstraction Level**: Do hooks return raw data or a complete domain interface?

## 4. Scalability & Organization

- **Consistent Structure**: Is the same folder pattern (e.g., `components`, `hooks`, `views`) used consistently?
- **Dead Code**: Unused components, styles, or logic fragments.

---

# What this skill does NOT review (Avoid overlap)

- **Technical UX**: Accessibility, speed, or visuals (Use `frontend-ux-review`).
- **Auth Flow**: Identity and roles (Use `auth-security-audit`).
- **Backend**: Any non-frontend logic (Use other skills).

---

# Mandatory Output Format

## 1. Component Health Report

Metrics on component size and responsibility distribution.

## 2. Structural Bottlenecks

List of "Props Hell" or "Effects loops" found.

## 3. State Management Audit

Review of the state flow and global vs local decisions.

## 4. Refactoring Suggestions

Specific code patterns to modernize or simplify the UI structure.
