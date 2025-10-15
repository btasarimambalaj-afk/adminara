# Character Encoding Guide

## Overview

All HTML files in AdminAra use UTF-8 encoding to properly display Turkish characters (ı, ğ, ü, ş, ö, ç).

## Common Encoding Issues

### Problem: Garbled Characters

**Symptoms**:
- `ı` appears as `Ä±`
- `ğ` appears as `ÄŸ`
- `ü` appears as `Ã¼`
- `ö` appears as `Ã¶`
- `ş` appears as `Åž`
- `ç` appears as `Ã§`

**Cause**: File saved with wrong encoding (ISO-8859-9, Windows-1254) but served as UTF-8.

### Solution

**1. Automated Fix**:
```bash
# Fix all HTML files
bash scripts/fix-encoding.sh

# Verify encoding
bash scripts/verify-encoding.sh
```

**2. Manual Fix**:
```bash
# Convert single file
iconv -f ISO-8859-9 -t UTF-8 input.html > output.html

# Or use dos2unix
dos2unix -k -o input.html
```

**3. Editor Settings**:
- VS Code: Set `"files.encoding": "utf8"`
- Sublime: Set `"default_encoding": "UTF-8"`
- Notepad++: Encoding → UTF-8

## HTML Meta Tag

**Required in all HTML files**:
```html
<head>
  <meta charset="UTF-8">
  <!-- other meta tags -->
</head>
```

## Server Configuration

**Express.js** (already configured):
```javascript
app.use(express.static('public', {
  setHeaders: (res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
  }
}));
```

## Testing

### Visual Test
Open each page and check Turkish characters:
- ı (lowercase i without dot)
- İ (uppercase I with dot)
- ğ (soft g)
- ü (u with umlaut)
- ş (s with cedilla)
- ö (o with umlaut)
- ç (c with cedilla)

### Automated Test
```bash
# Check all HTML files
bash scripts/verify-encoding.sh

# Expected output:
# ✅ All HTML files have correct encoding
```

## Git Configuration

**Prevent encoding issues in git**:
```bash
# .gitattributes
*.html text eol=lf encoding=utf-8
*.js text eol=lf encoding=utf-8
*.css text eol=lf encoding=utf-8
*.json text eol=lf encoding=utf-8
*.md text eol=lf encoding=utf-8
```

## Common Mistakes

### ❌ Wrong
```html
<meta charset="ISO-8859-9">
<meta charset="Windows-1254">
```

### ✅ Correct
```html
<meta charset="UTF-8">
```

## Troubleshooting

### Issue: Characters still garbled after fix

**Check**:
1. Browser cache cleared?
2. File actually saved as UTF-8?
3. Server sending correct Content-Type header?
4. Database using UTF-8 collation?

**Debug**:
```bash
# Check file encoding
file -b --mime-encoding public/index.html

# Should output: utf-8 or us-ascii
```

### Issue: Git shows encoding changes

**Solution**:
```bash
# Normalize line endings
git add --renormalize .

# Or configure git
git config core.autocrlf false
```

## Best Practices

1. ✅ Always use UTF-8 encoding
2. ✅ Add `<meta charset="UTF-8">` in `<head>`
3. ✅ Configure editor to save as UTF-8
4. ✅ Use UTF-8 in database (utf8mb4)
5. ✅ Set Content-Type header with charset
6. ✅ Test with Turkish characters
7. ✅ Run encoding verification before deploy

## Resources

- [UTF-8 Everywhere](http://utf8everywhere.org/)
- [W3C Character Encoding](https://www.w3.org/International/questions/qa-html-encoding-declarations)
- [MDN charset](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-charset)

## Status

**Current Encoding**: UTF-8 ✅
**All HTML Files**: Verified ✅
**Turkish Characters**: Working ✅
