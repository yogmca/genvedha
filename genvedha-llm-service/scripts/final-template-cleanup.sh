#!/bin/bash
# Final cleanup of generic template to remove ALL hardcoded content

TEMPLATE_DIR="templates/generic-template"

echo "🧹 Final cleanup of generic template..."

# Remove "Coorg Masala" references
find $TEMPLATE_DIR -type f -name "*.js" -o -name "*.html" | xargs sed -i.bak 's/Coorg Masala/{{BUSINESS_NAME}}/g'
find $TEMPLATE_DIR -type f -name "*.js" -o -name "*.html" | xargs sed -i.bak 's/Coorg/{{REGION}}/g'

# Remove "coffee" references (should be generic)
find $TEMPLATE_DIR -type f -name "*.js" -o -name "*.html" | xargs sed -i.bak 's/ and coffee//g'
find $TEMPLATE_DIR -type f -name "*.js" -o -name "*.html" | xargs sed -i.bak 's/coffee and //g'

# Remove "Why Choose Coorg Masala?" 
find $TEMPLATE_DIR -type f -name "*.js" -o -name "*.html" | xargs sed -i.bak 's/Why Choose Coorg Masala?/Why Choose {{BUSINESS_NAME}}?/g'

# Remove "plantations" references
find $TEMPLATE_DIR -type f -name "*.js" -o -name "*.html" | xargs sed -i.bak 's/from Coorg plantations/from trusted sources/g'
find $TEMPLATE_DIR -type f -name "*.js" -o -name "*.html" | xargs sed -i.bak 's/plantations/sources/g'

# Clean up backup files
find $TEMPLATE_DIR -name "*.bak" -delete

echo "✅ Template cleanup complete!"
echo "Run: node scripts/create-generic-template.js to regenerate if needed"
