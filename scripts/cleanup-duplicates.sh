#!/bin/bash
set -e

echo "🧹 AdminAra - Cleaning up duplicate files..."
echo "============================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Remove duplicate icons
if [ -f "public/icons/icon-192.png" ]; then
  rm public/icons/icon-192.png
  print_status "Removed public/icons/icon-192.png"
else
  print_warning "public/icons/icon-192.png not found"
fi

if [ -f "public/icons/icon-512.png" ]; then
  rm public/icons/icon-512.png
  print_status "Removed public/icons/icon-512.png"
else
  print_warning "public/icons/icon-512.png not found"
fi

# Handle talimat.txt
if [ -f "talimat.txt" ]; then
  print_warning "Found talimat.txt"
  echo "Options:"
  echo "1. Convert to MD: mv talimat.txt docs/TALIMAT.md"
  echo "2. Remove: rm talimat.txt"
  echo ""
  read -p "Choose option (1/2/skip): " choice
  
  case $choice in
    1)
      mv talimat.txt docs/TALIMAT.md
      print_status "Converted talimat.txt to docs/TALIMAT.md"
      ;;
    2)
      rm talimat.txt
      print_status "Removed talimat.txt"
      ;;
    *)
      print_warning "Skipped talimat.txt"
      ;;
  esac
fi

echo ""
print_status "Cleanup complete!"
