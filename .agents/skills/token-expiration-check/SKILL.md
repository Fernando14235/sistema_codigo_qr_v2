---
name: token-expiration-check
description: Specialized audit of token lifecycle, including expiration, refresh rotation, and session synchronization.
---

# Token Lifecycle & Expiration Audit

## Scope Definition (MANDATORY)

Identify the token management components.

1. **Token Generation**: Secret keys, payload, signing algorithm.
2. **Persistence Lifecycle**: Access token duration, Refresh token rotation.
3. **Renewal Flow**: Logic for automatic re-authentication.

---

# Audit Dimensions

## 1. Expiration Policy

- **Access Token (AT) Duration**: Is the AT short-lived (e.g., 15m - 1h)? Excessive duration increases hijacking risk.
- **Refresh Token (RT) Duration**: Is the RT long-lived enough for UX but short enough for security?
- **Hard Expiry**: Does the session eventually force a full login after a certain period (e.g., 7 days)?

## 2. Refresh & Rotation Security

Evaluate the renewal mechanism.

- **RT Rotation**: Is a new RT issued every time the AT is refreshed? (Prevents reuse of stolen RTs).
- **Reuse Detection**: If an old RT is used, does the server invalidate the entire family of tokens?
- **Server-Side Invalidation**: Is there a way to revoke tokens before expiry (Blacklisting/Database check)?

## 3. JWT Payload & Validation

- **Payload Exposure**: Are sensitive fields (Internal IDs, Passwords, PII) in the unencrypted JWT payload?
- **Clock Skew Handling**: Is there a grace period (e.g., 30s) for verification between server and client?
- **Algorithm Verification**: Is the `alg: none` attack mitigated? Are we forcing a secure algorithm (HS256/RS256)?

## 4. Frontend Token Handling

- **Storage Security**: Is the RT stored in an `HttpOnly` cookie or exposed to JS in `localStorage`?
- **Synchronization**: Does the app handle multiple tabs refreshing at once? (Race conditions).
- **Graceful Expiry**: Does the UI redirect to login _exactly_ when the token expires, or does it wait for a 401?

---

# What this skill does NOT review (Avoid overlap)

- **RBAC**: Role permissions (Use `auth-security-audit`).
- **Functional Logic**: Code that uses the token for business (Use `backend-code-review`).

---

# Mandatory Output Format

## 1. Token Lifecycle Score

Security vs UX balance assessment.

## 2. Technical Vulnerabilities

Specific risks like "RT reuse possible" or "LocalStorage exposure".

## 3. Expiration Mapping

Table of current vs recommended durations.

| Item      | Current Value | Recommendation | Rationale |
| --------- | ------------- | -------------- | --------- |
| AT Expiry | ...           | ...            | ...       |
| RT Expiry | ...           | ...            | ...       |

## 4. Implementation Fixes

Code snippets to improve the refresh-rotation flow or cookie headers.
