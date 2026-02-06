---
name: auth-security-audit
description: Deep security audit of authentication flows and Role-Based Access Control (RBAC) enforcement.
---

# Authentication & RBAC Security Audit

## Scope Definition (MANDATORY)

Identify the authentication boundaries and role-protected resources.

1. **Authentication Entry Points**: Login, Registration, Password Reset.
2. **Access Control**: Middlewares, decorators, or inline checks for Roles (Admin, Resident, Guard).
3. **Protected Resources**: Specific API endpoints or UI views.

Do NOT audit general business logic or data layer efficiency.

---

# Audit Dimensions

## 1. Identity & Credentials

Evaluate how users are identified and how secrets are handled.

- **Secure Password Storage**: Use of bcrypt/argon2 with appropriate salt/rounds.
- **Input Leaks**: Are passwords or credentials appearing in logs or error messages?
- **Identity Verification**: Are email/phone checks properly verified before granting access?

## 2. Role-Based Access Control (RBAC)

Verify the "Least Privilege" principle.

- **Vertical Escalation**: Can a Resident access Admin endpoints by changing an ID?
- **Horizontal Escalation**: Can a Resident access data from another Resident in the same residential?
- **Missing Guards**: Are there exposed endpoints without any role check?
- **Guard Bypass**: Can roles be spoofed via client-side state?

## 3. Session & Interaction Security

- **Secure Defaults**: Are cookies marked as `HttpOnly`, `Secure` (in prod), and `SameSite=Strict`?
- **Logout Integrity**: Does logout actually invalidate the session server-side (if stateful) or just clear client state?
- **Brute Force Protection**: Rate limiting on login/reset attempts.

---

# What this skill does NOT review (Avoid overlap)

- **Token Lifecycle**: Specific JWT expiration, refresh rotation, or validation algorithm details (Use `token-expiration-check`).
- **Code Logic**: General functional correctness (Use `backend-code-review`).

---

# Mandatory Output Format

## 1. Vulnerability Summary

List of identified security risks categorized by severity (CRITICAL, HIGH, MEDIUM, LOW).

## 2. RBAC Mapping Audit

Table showing checked endpoints and whether they correctly enforce the required role.

| Endpoint | Required Role | Enforcement Found | Status    |
| -------- | ------------- | ----------------- | --------- |
| ...      | ...           | ...               | [OK/FAIL] |

## 3. Recommendation Roadmap

Immediate actions to mitigate identified risks.
