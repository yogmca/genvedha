# Generic Template Integration - Ready to Implement

## Current Situation

The bookstore (and all generated apps) still show "Trusted Spices Exporter in India" because:
1. Template Manager uses `coorgmasala` template (hardcoded spice content)
2. App Generator doesn't inject business-specific content
3. Generic template exists but isn't being used

## Solution: 3 File Changes

### Change 1: Update config/index.js

**Current:**
```javascript
template: {
  localPath: path.join(__dirname, '../templates/coorgmasala'),
  // ...
}
```

**Change to:**
```javascript
template: {
  localPath: path.join(__dirname, '../templates/generic-template'),
  // ...
}
```

### Change 2: Update services/template-manager.js

**Line 16 - Change constructor:**
```javascript
constructor() {
  // Use generic template instead of coorgmasala
  this.templatePath = path.join(__dirname, '../templates/generic-template');
  this.isInitialized = false;
}
```

**Lines 25-48 - Simplify initialize():**
```javascript
async initialize() {
  try {
    console.log('📦 Initializing template manager...');
    
    // Check if generic template exists
    if (!await fs.pathExists(this.templatePath)) {
      throw new Error(
        'Generic template not found! Run: node scripts/create-generic-template.js'
      );
    }
    
    console.log('✅ Using pre-cleaned generic template');
    this.isInitialized = true;
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize template:', error.message);
    throw error;
  }
}
```

**Remove these methods (no longer needed):**
- `cloneTemplate()`
- `updateTemplate()`

### Change 3: Update services/app-generator.js

**Add after line 97 (after copyTemplate):**
```javascript
// Step 3.5: Inject business content into placeholders
console.log('📝 Step 3.5: Injecting business content...');
await this.injectBusinessContent(appPath, customizations);
this._updateGenerationStatus(generationId, 'injecting', 45);
```

**Add new method (after generateApp method):**
```javascript
/**
 * Inject business-specific content into generic template placeholders
 */
async injectBusinessContent(appPath, customizations) {
  try {
    // Create replacement map
    const replacements = {
      '{{BUSINESS_NAME}}': customizations.appName || 'My Business',
      '{{BUSINESS_SLUG}}': (customizations.appName || 'my-business')
        .toLowerCase()
        .replace(/\s+/g, '-'),
      '{{BUSINESS_TAGLINE}}': customizations.brandingChanges?.tagline || 'Quality Products',
      '{{PRODUCT_TYPE}}': customizations.businessType || 'product',
      '{{PRODUCT_TYPE_PLURAL}}': (customizations.businessType || 'product') + 's',
      '{{PRODUCT_TYPE_CAPITALIZED}}': (customizations.businessType || 'product')
        .charAt(0).toUpperCase() + (customizations.businessType || 'product').slice(1),
      '{{PRODUCT_DESCRIPTION}}': 'premium quality products',
      '{{REGION}}': '',
      '{{ORIGIN}}': ''
    };
    
    // Files to inject content into
    const filesToInject = [
      'frontend/src/pages/Home.js',
      'frontend/public/index.html',
      'backend/models/Product.js',
      'backend/seed.js',
      'README.md'
    ];
    
    let injectedCount = 0;
    
    for (const file of filesToInject) {
      const filePath = path.join(appPath, file);
      
      if (await fs.pathExists(filePath)) {
        let content = await fs.readFile(filePath, 'utf8');
        let modified = false;
        
        // Replace all placeholders
        for (const [placeholder, value] of Object.entries(replacements)) {
          if (content.includes(placeholder)) {
            content = content.replace(new RegExp(placeholder, 'g'), value);
            modified = true;
          }
        }
        
        if (modified) {
          await fs.writeFile(filePath, content, 'utf8');
          injectedCount++;
        }
      }
    }
    
    console.log(`✅ Injected content into ${injectedCount} files`);
    return true;
  } catch (error) {
    console.error('❌ Failed to inject business content:', error.message);
    throw error;
  }
}
```

## Testing After Changes

1. **Restart LLM service:**
   ```bash
   # Stop current service (Ctrl+C in Terminal 1)
   cd genvedha-llm-service && npm start
   ```

2. **Generate new test app:**
   ```bash
   node test-bookstore-simple.js
   ```

3. **Verify results:**
   - Check generated app for "Page Turner Books" (not spices)
   - Verify no "Coorg" or "Trusted Spices Exporter" text
   - Confirm book-related content appears

## Estimated Time

- Make changes: 10 minutes
- Restart service: 1 minute
- Test generation: 2 minutes
- Verify: 5 minutes

**Total: ~20 minutes**

## Risk Assessment

**Low Risk:**
- Changes are isolated to template system
- Generic template already created and validated
- Can rollback by reverting config changes
- Existing generated apps unaffected

## Rollback Plan

If issues occur:
```javascript
// In config/index.js, change back to:
localPath: path.join(__dirname, '../templates/coorgmasala')
```

## Ready to Implement?

All changes are documented above. The implementation is straightforward:
1. Update 1 config file
2. Simplify template-manager.js
3. Add content injection to app-generator.js

Would you like me to implement these changes now?
