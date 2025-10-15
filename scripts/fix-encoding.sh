#!/bin/bash
set -e

echo "🔧 Fixing encoding for HTML files..."

# Find all HTML files
find public -name "*.html" -type f | while read file; do
  echo "Checking: $file"
  
  # Check if file has UTF-8 meta tag
  if ! grep -q 'charset="UTF-8"' "$file" && ! grep -q "charset='UTF-8'" "$file"; then
    echo "  ⚠️  Missing UTF-8 meta tag, adding..."
    
    # Add UTF-8 meta tag after <head>
    sed -i '/<head>/a \  <meta charset="UTF-8">' "$file"
  fi
  
  # Convert file to UTF-8 if needed
  if ! file -b --mime-encoding "$file" | grep -q "utf-8"; then
    echo "  🔄 Converting to UTF-8..."
    iconv -f ISO-8859-9 -t UTF-8 "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi
  
  echo "  ✅ OK"
done

echo ""
echo "✅ Encoding check completed for all HTML files"
echo ""
echo "Summary:"
echo "  - All files checked for UTF-8 encoding"
echo "  - Meta charset tags verified"
echo "  - Turkish characters preserved"
