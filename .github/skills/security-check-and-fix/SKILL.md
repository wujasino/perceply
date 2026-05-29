---
name: security-check-and-fix
description: 'Comprehensive security audit and auto-repair for ai-scanner. Scans for CVE vulnerabilities in npm packages, exposed secrets, package.json misconfigurations, CWE security patterns, and SSL/TLS issues. Automatically fixes issues where possible and generates detailed security reports. Use when: checking website security, fixing security vulnerabilities, performing security audit, scanning for exposed credentials, validating security compliance.'
argument-hint: 'Optional: specific security focus (npm-packages, secrets, cwe-patterns, ssl-config) or "full" for comprehensive scan'
user-invocable: true
---

# Security Check and Fix

## Overview

This skill enables automated security auditing and repair of the ai-scanner application. It performs comprehensive checks across multiple security layers and automatically remediates identified vulnerabilities where safe to do so.

## When to Use

- **Security audit**: Regular security reviews of the application
- **Vulnerability response**: When security issues are reported
- **Pre-deployment**: Before pushing to production or merging to main
- **Dependency updates**: After upgrading packages
- **Secret management**: Validating no credentials are exposed
- **Compliance checks**: Ensuring security best practices

## Security Checks Performed

### 1. CVE Vulnerability Scanning
- Scans npm packages (package.json dependencies)
- Identifies known CVE (Common Vulnerabilities and Exposures)
- Checks severity levels and affected versions
- Auto-updates packages when safe updates exist
- Generates remediation report

### 2. Exposed Secrets Detection
- Scans `.env.local` and environment files
- Checks for common patterns: API keys, tokens, passwords
- Validates `.gitignore` includes sensitive files
- Suggests remediation (e.g., move to `.env.example`)

### 3. Package Configuration Security
- Validates `package.json` configuration
- Checks npm scripts for security risks
- Verifies dependency integrity
- Identifies deprecated or unmaintained packages

### 4. CWE Pattern Scanning
- Scans source code for Common Weakness Enumeration patterns
- Common checks: SQL injection, XSS, authentication bypasses
- Identifies unsafe API usage
- Provides remediation guidance

### 5. SSL/TLS Configuration
- Validates HTTPS enforcement
- Checks SSL certificate validity (for deployed sites)
- Reviews security headers (HSTS, CSP, etc.)
- Tests in netlify.toml and vite.config.ts

## Step-by-Step Procedure

### Quick Security Check (5 minutes)
1. Request: "Check website security"
2. Agent runs npm vulnerability scan
3. Agent checks for exposed secrets
4. Agent reports findings and recommendations

### Full Security Audit (15 minutes)
1. Request: "Run full security audit"
2. Agent performs all 5 security checks listed above
3. Agent generates comprehensive security report
4. Agent shows high/medium/low severity issues
5. Agent proposes automatic fixes

### Auto-Fix Workflow
1. After audit, agent identifies auto-fixable issues:
   - Outdated packages with safe updates
   - Secrets moved to proper env files
   - Configuration adjustments
2. Agent proposes fixes for user approval
3. User confirms or cancels each fix
4. Agent applies fixes and re-runs validation

### Post-Fix Validation
1. After fixes applied, agent:
   - Re-scans for vulnerabilities
   - Verifies build still passes
   - Confirms no new issues introduced
   - Generates final security report

## Example Prompts

- `Check website security`
- `Run full security audit for ai-scanner`
- `Scan for CVE vulnerabilities`
- `Find and fix exposed secrets`
- `Validate SSL/TLS configuration`
- `Perform security compliance check before deployment`

## Output

The skill generates:
- **Security Report**: Summary of findings by severity
- **Detailed Findings**: Each vulnerability with CVE ID, description, and remediation steps
- **Auto-Fix Log**: Changes applied, before/after comparison
- **Compliance Status**: Pass/fail on major security checks
- **Recommendations**: Next steps and best practices

## Important Notes

⚠️ **Sensitive Data**: The agent never commits or logs API keys and secrets to version control. Always review generated fixes for sensitive data.

✅ **Testing**: After security fixes, the agent re-runs validation to ensure no build breaks or new issues introduced.

🔐 **Best Practices**: 
- Run security audits before each deployment
- Keep dependencies updated regularly
- Use environment variables for all secrets
- Enable pre-commit hooks to catch secrets
- Review all auto-fixes before committing

## Related Skills

- See also: TypeScript dependency upgrades, deployment validation
