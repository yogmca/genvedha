#!/bin/bash
# Comprehensive cleanup of generic template to remove ALL hardcoded content

TEMPLATE_DIR="genvedha-llm-service/templates/generic-template"

echo "🧹 Starting comprehensive cleanup of generic template..."

# Function to safely replace in files
safe_replace() {
    local pattern="$1"
    local replacement="$2"
    local file_pattern="$3"
    
    find "$TEMPLATE_DIR" -type f -name "$file_pattern" -exec sed -i.bak "s/$pattern/$replacement/g" {} \;
}

# 1. Replace "Coorg Masala" references
echo "📝 Cleaning Coorg Masala references..."
safe_replace "Coorg Masala Private Limited" "{{BUSINESS_NAME}}" "*.js"
safe_replace "Coorg Masala" "{{BUSINESS_NAME}}" "*.js"
safe_replace "Coorg Masala" "{{BUSINESS_NAME}}" "*.css"

# 2. Replace "Coorg" references (region-specific)
echo "📝 Cleaning Coorg region references..."
safe_replace "from the heart of Coorg" "from trusted sources" "*.js"
safe_replace "from Coorg plantations" "from trusted sources" "*.js"
safe_replace "from Coorg" "from trusted sources" "*.js"
safe_replace "Coorg plantations" "trusted sources" "*.js"
safe_replace "Premium quality Coorg" "Premium quality" "*.js"
safe_replace "Authentic Ceylon cinnamon from Coorg plantations" "Authentic Ceylon cinnamon from trusted sources" "*.js"
safe_replace "Pure organic turmeric powder from Coorg" "Pure organic turmeric powder" "*.js"
safe_replace "Freshly ground Coorg coffee powder" "Freshly ground coffee powder" "*.js"
safe_replace "Premium Coorg coffee powder" "Premium coffee powder" "*.js"
safe_replace "Bulk pack of premium Coorg" "Bulk pack of premium" "*.js"
safe_replace "Coorg black pepper" "black pepper" "*.js"
safe_replace "Coorg, India" "{{LOCATION}}" "*.js"
safe_replace "Coorg" "{{REGION}}" "*.js"

# 3. Replace coffee-specific references (make generic)
echo "📝 Cleaning coffee-specific references..."
safe_replace "spices and coffee" "{{PRODUCT_TYPE_PLURAL}}" "*.js"
safe_replace "coffee and spices" "{{PRODUCT_TYPE_PLURAL}}" "*.js"
safe_replace "Indian spices and coffee" "{{PRODUCT_TYPE_PLURAL}}" "*.js"
safe_replace "coffee capital of India" "trusted region" "*.js"
safe_replace "'coffee'" "'{{PRODUCT_CATEGORY}}'" "*.js"
safe_replace '"coffee"' '"{{PRODUCT_CATEGORY}}"' "*.js"
safe_replace "Coffee Powder" "{{PRODUCT_NAME}}" "*.js"
safe_replace "Coffee" "{{PRODUCT_CATEGORY_NAME}}" "*.js"

# 4. Replace plantation references
echo "📝 Cleaning plantation references..."
safe_replace "Direct from plantations to your kitchen" "Direct from source to your kitchen" "*.js"
safe_replace "plantations" "sources" "*.js"

# 5. Replace hardcoded email addresses
echo "📝 Cleaning email references..."
safe_replace "admin@coorgmasala.com" "admin@{{DOMAIN}}" "*.js"
safe_replace "yogemca@gmail.com" "{{CONTACT_EMAIL}}" "*.js"

# 6. Replace hardcoded database names
echo "📝 Cleaning database references..."
safe_replace "mongodb://localhost:27017/coorg-spices" "mongodb://localhost:27017/{{DB_NAME}}" "*.js"
safe_replace "coorg-spices" "{{APP_NAME}}" "*.sh"
safe_replace "coorg-backend" "{{APP_NAME}}-backend" "*.sh"
safe_replace "coorg-frontend" "{{APP_NAME}}-frontend" "*.sh"

# 7. Replace hardcoded API messages
echo "📝 Cleaning API messages..."
safe_replace "Coorg Masala API is running" "{{BUSINESS_NAME}} API is running" "*.js"
safe_replace "New Export Inquiry - Coorg Masala" "New Export Inquiry - {{BUSINESS_NAME}}" "*.js"
safe_replace "Export Inquiry - Coorg Masala" "Export Inquiry - {{BUSINESS_NAME}}" "*.js"
safe_replace "This inquiry was submitted through the Coorg Masala Export page" "This inquiry was submitted through the {{BUSINESS_NAME}} Export page" "*.js"

# 8. Replace hardcoded UI text
echo "📝 Cleaning UI text..."
safe_replace "Premium Coorg Masala" "Premium {{BUSINESS_NAME}}" "*.js"
safe_replace "Join Coorg Masala today" "Join {{BUSINESS_NAME}} today" "*.js"
safe_replace "Login to your Coorg Masala account" "Login to your {{BUSINESS_NAME}} account" "*.js"
safe_replace "Why Choose Coorg Masala?" "Why Choose {{BUSINESS_NAME}}?" "*.js"
safe_replace "Premium Indian spices from the heart of Coorg" "Premium {{PRODUCT_TYPE_PLURAL}} from trusted sources" "*.js"

# 9. Replace category enums that are hardcoded
echo "📝 Cleaning category enums..."
safe_replace "enum: \['spices', 'coffee'\]" "enum: ['{{PRODUCT_TYPE}}s', '{{PRODUCT_CATEGORY}}']" "*.js"

# 10. Replace image references to coffee
echo "📝 Cleaning image references..."
safe_replace "'/images/coffee.jpg'" "'/images/{{PRODUCT_IMAGE}}'" "*.js"
safe_replace '"/images/coffee.jpg"' '"/images/{{PRODUCT_IMAGE}}"' "*.js"

# 11. Clean up backup files
echo "🗑️  Removing backup files..."
find "$TEMPLATE_DIR" -name "*.bak" -delete

# 12. Clean up specific problematic files
echo "🗑️  Removing problematic backup and test files..."
find "$TEMPLATE_DIR" -name "*_backup*.js" -delete
find "$TEMPLATE_DIR" -name "*_back*.js" -delete
find "$TEMPLATE_DIR" -name "*.js.backup" -delete
find "$TEMPLATE_DIR" -name "*.js.bak" -delete

# 13. Remove coorg-spices specific files
echo "🗑️  Removing Coorg-specific files..."
rm -f "$TEMPLATE_DIR/coorg-spices-deployment.tar.gz"
rm -f "$TEMPLATE_DIR/backend/public/images/coffee.jpg"

echo ""
echo "✅ Comprehensive template cleanup complete!"
echo ""
echo "📊 Summary of changes:"
echo "   - Replaced all 'Coorg Masala' references with {{BUSINESS_NAME}}"
echo "   - Replaced all 'Coorg' region references with {{REGION}}"
echo "   - Replaced all 'coffee' product references with {{PRODUCT_CATEGORY}}"
echo "   - Replaced all 'plantations' with 'sources'"
echo "   - Replaced hardcoded emails with placeholders"
echo "   - Replaced hardcoded database names with {{DB_NAME}}"
echo "   - Removed backup and test files"
echo ""
echo "🔄 Next steps:"
echo "   1. Review the changes in the template directory"
echo "   2. Test app generation with: node test-generic-template.js"
echo "   3. Verify all placeholders are properly replaced"
echo ""
