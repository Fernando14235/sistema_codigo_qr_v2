## Summary
Medium Risk – JWT expiration validated but refresh token reuse risk detected.

## Critical Findings
None

## High Risk Findings
- Refresh tokens are not invalidated after use.
- Role enforcement missing on /admin endpoint.

## Medium / Low Improvements
- Add rate limiting on login endpoint.
- Move secret to environment variable.

## Privilege Escalation Risks
User role taken from request payload in update endpoint.

## Token Lifecycle Observations
Refresh token stored without expiration tracking.