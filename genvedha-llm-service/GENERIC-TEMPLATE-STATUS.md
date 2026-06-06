# Generic Template Integration - Current Status

## ✅ Completed Steps

### 1. Architecture & Planning
- ✅ Analyzed current app-generator workflow
- ✅ Designed generic template integration architecture
- ✅ Created comprehensive integration plan
- ✅ Documented the workflow in [`GENERIC-TEMPLATE-INTEGRATION-PLAN.md`](GENERIC-TEMPLATE-INTEGRATION-PLAN.md)

### 2. Generic Template Creation
- ✅ Created [`scripts/create-generic-template.js`](scripts/create-generic-template.js)
- ✅ Ran script successfully
- ✅ Generated generic template at `templates/generic-template/`
- ✅ Cleaned 5 key files with placeholders

### 3. Verification
- ✅ Placeholders confirmed in Home.js:
  - `{{BUSINESS_NAME}}`
  - `{{PRODUCT_TYPE}}`
  - `{{BUSINESS_TAGLINE}}`

## ⚠️ Issues Found

### Partial Cleaning
Some hardcoded content still remains:
- "Coorg" appears in several places
- "Indian spices" references
- Specific product names (turmeric, cumin, etc.)

**Root Cause:** The replacement patterns in the script need to be more comprehensive.

## 🔄 Remaining Work

### Phase 1: Improve Template Cleaning (HIGH PRIORITY)
1. **Enhance cleaning script** with more comprehensive replacements:
   - Add "Coorg" → `{{REGION}}`
   - Add "Indian" → `{{ORIGIN}}`
   - Add specific product names → `{{SAMPLE_PRODUCT_*}}`
   - Add "aromatic spices" → `{{PRODUCT_DESCRIPTION}}`
   
2. **Re-run cleaning script** to generate better generic template

3. **Manual review** of generated template for any remaining hardcoded content

### Phase 2: Update Template Manager
**File:** `services/template-manager.js`

**Changes Needed:**
```javascript
class TemplateManager {
  constructor() {
    // Change from coorgmasala to generic-template
    this.templatePath = path.join(__dirname, '../templates/generic-template');
  }

  async initialize() {
    // Verify generic template exists
    if (!await fs.pathExists(this.templatePath)) {
      throw new Error('Generic template not found. Run: node scripts/create-generic-template.js');
    }
    
    console.log('✅ Using generic template');
    this.isInitialized = true;
  }

  async copyTemplate(destination) {
    // Copy from generic template
    await fs.copy(this.templatePath, destination, {
      filter: (src) => !src.includes('node_modules') && !src.includes('.git')
    });
  }
}
```

### Phase 3: Update App Generator
**File:** `services/app-generator.js`

**Add after Step 3 (template copy):**
```javascript
// Step 3.5: Inject business content
console.log('📝 Step 3.5: Injecting business content...');
await this.injectBusinessContent(appPath, customizations);
```

**Add new method:**
```javascript
async injectBusinessContent(appPath, customizations) {
  const ContentInjector = require('./content-injector');
  const contentInjector = new ContentInjector();
  
  // Create replacement map
  const replacements = {
    '{{BUSINESS_NAME}}': customizations.appName,
    '{{BUSINESS_TAGLINE}}': customizations.brandingChanges.tagline,
    '{{PRODUCT_TYPE}}': customizations.businessType,
    '{{PRODUCT_TYPE_PLURAL}}': customizations.businessType + 's',
    // Add more as needed
  };
  
  // Files to inject
  const filesToInject = [
    'frontend/src/pages/Home.js',
    'frontend/public/index.html',
    'backend/models/Product.js',
    'backend/seed.js',
    'README.md'
  ];
  
  for (const file of filesToInject) {
    const filePath = path.join(appPath, file);
    if (await fs.pathExists(filePath)) {
      let content = await fs.readFile(filePath, 'utf8');
      
      // Replace all placeholders
      for (const [placeholder, value] of Object.entries(replacements)) {
        content = content.replace(new RegExp(placeholder, 'g'), value);
      }
      
      await fs.writeFile(filePath, content, 'utf8');
    }
  }
  
  console.log('✅ Business content injected');
}
```

### Phase 4: Testing
1. **Restart LLM service** to load new template manager
2. **Generate test app** (bookstore or produce store)
3. **Verify** no spice content appears
4. **Check** business name appears correctly
5. **Validate** all placeholders replaced

### Phase 5: Git Commit
```bash
git add templates/generic-template/
git add services/template-manager.js
git add services/app-generator.js
git add scripts/create-generic-template.js
git commit -m "Integrate generic template system - remove hardcoded spice content"
```

## 📊 Current Test Results

### What Works:
- ✅ Generic template created
- ✅ Placeholders inserted
- ✅ Script runs successfully
- ✅ Template structure intact

### What Needs Fixing:
- ❌ Some hardcoded "Coorg" text remains
- ❌ Template Manager still uses coorgmasala template
- ❌ App Generator doesn't inject content
- ❌ Generated apps still show spice content

## 🎯 Next Immediate Actions

1. **Improve cleaning script** (30 min)
2. **Re-run script** (5 min)
3. **Update template-manager.js** (15 min)
4. **Update app-generator.js** (30 min)
5. **Test with new app generation** (15 min)
6. **Verify and commit** (15 min)

**Total Time Remaining:** ~2 hours

## 📝 Notes

- Generic template system components already exist (template-cleaner, content-injector)
- Just need to wire them into the generation workflow
- One-time template cleaning approach is correct
- Template will be committed to Git after final cleaning

---

**Status:** In Progress (60% complete)  
**Last Updated:** 2026-05-12T15:42:00Z  
**Next Step:** Improve cleaning script and update template-manager.js
