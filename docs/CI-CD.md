# CI/CD Pipeline Documentation

## Overview

AdminAra uses GitHub Actions for continuous integration and deployment with automated testing, security scanning, and Docker builds.

## Workflows

### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)

**Triggers**:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs**:

#### Lint

- ESLint code quality check
- Prettier formatting check
- Runs on: `ubuntu-latest`

#### Test

- Unit tests with Jest
- Integration tests with Redis service
- Coverage report generation
- Upload to Codecov
- Runs on: `ubuntu-latest`
- Needs: `lint`

#### E2E

- End-to-end tests with Playwright
- Upload test reports as artifacts
- Runs on: `ubuntu-latest`
- Needs: `test`

#### Security

- npm audit for dependency vulnerabilities
- Snyk security scanning (if token configured)
- Runs on: `ubuntu-latest`
- Needs: `lint`

#### Build

- Docker image build
- Push to Docker Hub (main branch only)
- Runs on: `ubuntu-latest`
- Needs: `test`, `e2e`
- Only on: `push` events

#### Deploy

- Trigger Render.com deployment
- Runs on: `ubuntu-latest`
- Needs: `build`
- Only on: `main` branch

### 2. Security Scan (`.github/workflows/security-scan.yml`)

**Triggers**:

- Push to `main`
- Weekly schedule (Sunday 00:00 UTC)

**Jobs**:

- Dependency vulnerability scanning with npm audit

### 3. Deploy (`.github/workflows/deploy.yml`)

**Triggers**:

- Push to `main` branch
- Version tags (`v*`)

**Jobs**:

- Notify Render.com deployment
- Success/failure notifications

### 4. CodeQL Analysis (`.github/workflows/codeql.yml`)

**Triggers**:

- Push to `main` or `develop`
- Pull requests to `main`
- Weekly schedule (Monday 06:00 UTC)

**Jobs**:

- Static code analysis for security vulnerabilities
- JavaScript/TypeScript scanning

## Required Secrets

Configure in GitHub repository settings:

```bash
# Docker Hub (optional)
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password

# Snyk (optional)
SNYK_TOKEN=your-snyk-token

# Codecov (optional)
CODECOV_TOKEN=your-codecov-token
```

## Local Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e:playwright

# Generate coverage
npm run test:coverage

# Security audit
npm audit --audit-level=moderate

# Build Docker image
docker build -t adminara:local .
```

## Pull Request Process

1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create PR
4. CI pipeline runs automatically:
   - ✅ Lint checks
   - ✅ Unit tests
   - ✅ Integration tests
   - ✅ E2E tests
   - ✅ Security scan
5. Review and merge after all checks pass

## Deployment Flow

```
develop → PR → main → CI/CD → Build → Deploy → Production
```

**Automatic Deployment**:

- Push to `main` triggers Render.com auto-deploy
- No manual intervention required
- Rollback available via Render dashboard

## Monitoring CI/CD

**GitHub Actions Dashboard**:

- View workflow runs: `https://github.com/[owner]/[repo]/actions`
- Check test results and logs
- Download artifacts (Playwright reports)

**Codecov Dashboard**:

- Coverage trends: `https://codecov.io/gh/[owner]/[repo]`
- PR coverage diff
- File-level coverage

**Snyk Dashboard**:

- Vulnerability reports: `https://app.snyk.io`
- Dependency updates
- Security advisories

## Troubleshooting

### Tests Failing in CI but Passing Locally

```bash
# Use same Node version as CI
nvm use 18

# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests with CI environment
CI=true npm test
```

### Docker Build Failing

```bash
# Test build locally
docker build -t adminara:test .

# Check Dockerfile syntax
docker build --no-cache -t adminara:test .
```

### Security Scan Failures

```bash
# Run audit locally
npm audit

# Fix vulnerabilities
npm audit fix

# Force fix (may break)
npm audit fix --force
```

## Best Practices

1. **Always run tests locally before pushing**
2. **Keep dependencies updated** (weekly check)
3. **Review security scan results** (don't ignore warnings)
4. **Use semantic versioning** for releases
5. **Write meaningful commit messages**
6. **Add tests for new features**
7. **Update documentation** with code changes

## Performance

**Average CI/CD Times**:

- Lint: ~30s
- Test: ~2min
- E2E: ~3min
- Security: ~1min
- Build: ~2min
- **Total**: ~8-10min

## Future Enhancements

- [ ] Automated changelog generation
- [ ] Slack/Discord notifications
- [ ] Performance regression testing
- [ ] Visual regression testing
- [ ] Automated dependency updates (Dependabot)
- [ ] Staging environment deployment
