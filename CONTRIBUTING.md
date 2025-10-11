# Contributing Guide

## Development Setup

```bash
# Clone repository
git clone https://github.com/btasarimambalaj-afk/adminara.git
cd adminara

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm start
```

## Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for classes
- Add JSDoc comments for functions

## Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build/config changes

Example:
```
feat: Add dark mode support
fix: Resolve WebRTC connection timeout
docs: Update deployment guide
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit changes (`git commit -m 'feat: Add amazing feature'`)
6. Push to branch (`git push origin feat/amazing-feature`)
7. Open a Pull Request

## PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No console.log statements
- [ ] No commented code

## Code Review

All PRs require:
- At least 1 approval
- All tests passing
- No merge conflicts

## Questions?

Open an issue or contact maintainers.
