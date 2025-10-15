#!/bin/bash

echo "📦 Installing git hooks..."

# Create hooks directory if not exists
mkdir -p .git/hooks

# Copy pre-commit hook
cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed"
echo ""
echo "Installed hooks:"
echo "  - pre-commit: Validates file encoding before commit"
echo ""
echo "To bypass hook (not recommended):"
echo "  git commit --no-verify"
