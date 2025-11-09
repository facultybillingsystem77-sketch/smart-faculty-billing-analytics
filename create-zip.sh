#!/bin/bash

# Create zip file excluding unnecessary directories
echo "Creating downloadable zip file..."

zip -r smart-faculty-billing-system.zip . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".git/*" \
  -x "*.log" \
  -x ".env.local" \
  -x "bun.lock" \
  -x "smart-faculty-billing-system.zip"

echo "✅ Zip file created: smart-faculty-billing-system.zip"
echo "📦 Size: $(du -h smart-faculty-billing-system.zip | cut -f1)"
