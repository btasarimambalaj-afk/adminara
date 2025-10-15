# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| < 1.3   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

### 1. Private Vulnerability Reporting (Preferred)
Use GitHub's private vulnerability reporting feature:
1. Go to the Security tab
2. Click "Report a vulnerability"
3. Fill in the details

### 2. Email
Send details to: **security@adminara.com** (or your team email)

### 3. What to Include
- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue

## Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

## Security Measures

### Current Protections
- ✅ Helmet.js (Security headers)
- ✅ Strict CSP (Content Security Policy)
- ✅ CORS whitelist
- ✅ Rate limiting (DDoS protection)
- ✅ CSRF protection
- ✅ httpOnly cookies (XSS protection)
- ✅ Input validation (Joi schemas)
- ✅ PII masking in logs
- ✅ Dependency scanning (npm audit)
- ✅ CodeQL analysis
- ✅ Secret scanning

### Known Issues
- **node-telegram-bot-api:** Transitive dependency vulnerabilities (form-data, tough-cookie)
  - Status: Monitoring upstream fixes
  - Mitigation: Not directly exploitable, backend-only usage
- **swagger-jsdoc:** Validator.js vulnerability
  - Status: Dev/docs only, not production-critical
  - Mitigation: Isolated to API documentation

## Disclosure Policy

- We follow responsible disclosure practices
- Security researchers will be credited (if desired)
- We aim to coordinate disclosure timing with reporters
- Public disclosure after fix is deployed (typically 90 days)

## Security Updates

Security updates are released as patch versions (e.g., 1.3.9) and announced via:
- GitHub Security Advisories
- Release notes
- Commit messages with `[SECURITY]` prefix

## Contact

For security concerns: **security@adminara.com**  
For general issues: Use GitHub Issues

---

**Last Updated:** 2025-10-15  
**Version:** 1.0
