---
name: frontend-ux-review
description: Technical audit of User Experience, focusing on performance metrics, accessibility, and interactive feedback.
---

# Technical UX & Interaction Audit

## Scope Definition (MANDATORY)

Identify the user-facing paths or views under review.

1. **User Journey**: E.g., "Visitor Registration Flow", "Admin QR Dashboard".
2. **Devices**: Responsive behavior check (Mobile, Tablet, Desktop).
3. **Connectivity Scenarios**: Behavior on slow networks (3G/Offline).

---

# Audit Dimensions

## 1. Visual Performance (Web Vitals)

- **Cumulative Layout Shift (CLS)**: Does the UI jump when images or fonts load?
- **Largest Contentful Paint (LCP)**: Is the main content visible quickly?
- **Empty States**: Are there blank screens while data fetches? (Use of Skeletons vs Loaders).

## 2. Accessibility (A11y)

- **Semantic HTML**: Use of `button` for actions vs `a` for links. Proper use of `main`, `nav`, `section`.
- **ARIA Attributes**: Are roles defined for custom interactive components?
- **Keyboard Navigation**: Can the app be used without a mouse? Is there a visible focus indicator?
- **Color Contrast**: Is text readable against backgrounds?

## 3. Feedback & Communication

- **Optimistic UI**: Does the app feel responsive by showing updates before server confirmation?
- **Error Visibility**: Are errors clear and actionable, or cryptic ("Something went wrong")?
- **Success Feedback**: Clear confirmation after critical actions (e.g., "QR generated successfully").
- **Loading Indicators**: Correct placement of progress indicators (not block-level spiners for small items).

## 4. Responsive & Ergonomic Design

- **Touch Targets**: Are buttons large enough for mobile thumbs?
- **Layout Adaptation**: Does it work on small screens without horizontal scrolling?
- **Form UX**: Correct input types (email, tel, numeric keypad).

---

# What this skill does NOT review (Avoid overlap)

- **Code Organization**: Logic partitioning (Use `frontend-structure-review`).
- **Security**: Data leakage or role checks (Use `auth-security-audit`).

---

# Mandatory Output Format

## 1. UX Friction Audit

List of identified "pain points" where technical implementation hinders the user.

## 2. Accessibility Violation Log

Specific ARIA or semantic issues that block assistive technologies.

## 3. Performance & Feedback Rating

Score [0-10] for perceived speed and communication quality.

## 4. Interaction Action Plan

UX improvements with high impact/low effort for production readiness.
