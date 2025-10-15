#!/bin/bash

echo "🔍 Verifying encoding for all HTML files..."
echo ""

ISSUES=0

# Find all HTML files
find public -name "*.html" -type f | while read file; do
  echo "Checking: $file"
  
  # Check encoding
  ENCODING=$(file -b --mime-encoding "$file")
  if [ "$ENCODING" != "utf-8" ] && [ "$ENCODING" != "us-ascii" ]; then
    echo "  ❌ Wrong encoding: $ENCODING"
    ISSUES=$((ISSUES + 1))
  else
    echo "  ✅ Encoding: $ENCODING"
  fi
  
  # Check meta tag
  if grep -q 'charset="UTF-8"' "$file" || grep -q "charset='UTF-8'" "$file"; then
    echo "  ✅ UTF-8 meta tag present"
  else
    echo "  ❌ Missing UTF-8 meta tag"
    ISSUES=$((ISSUES + 1))
  fi
  
  # Check for common encoding issues
  if grep -qP '[\x80-\xFF]' "$file"; then
    if grep -qP 'Ã|Ä|Å|Ã§|Ã¶|Ã¼|Ä±|ÄŸ|Åž' "$file"; then
      echo "  ❌ Found encoding artifacts (Ã, Ä, etc.)"
      ISSUES=$((ISSUES + 1))
    fi
  fi
  
  echo ""
done

if [ $ISSUES -eq 0 ]; then
  echo "✅ All HTML files have correct encoding"
else
  echo "⚠️  Found $ISSUES encoding issues"
  echo "Run: bash scripts/fix-encoding.sh"
fi
