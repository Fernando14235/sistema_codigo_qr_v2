# Auth Security Checklist

- Passwords hashed with bcrypt/argon2
- No hardcoded secrets
- JWT expiration enforced
- Token verification middleware centralized
- Role checks at route level
- No role from client trusted
- Refresh token rotation (if used)
- No sensitive info in logs
- Generic auth error messages
- Brute-force mitigation considered
