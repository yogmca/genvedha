# Generic Template Integration Plan

## Problem Statement

The LLM service currently generates apps with hardcoded spice business content instead of using truly generic templates. Generated apps show:
- "Trusted Spices Exporter in India"
- Spice-related product data
- Hardcoded business information

## Root Cause

The [`app-generator.js`](services/app-generator.js) copies the template directly without:
1. Cleaning business-specific content
2. Injecting new business data properly
3. Using the generic template system components

## Existing Components (Already Built)

### 1. Template Cleaner (`services/template-cleaner.js`)
**Purpose:** Remove business-specific content and replace with placeholders
**Methods:**
- `cleanContent(content, fileType)` - Removes hardcoded content
- `validateCleanedContent(content)` - Validates placeholders exist
- Pattern matching for business names, product types, categories

### 2. Content Injector (`services/content-injector.js`)
**Purpose:** Inject new business data into placeholders
**Methods:**
- `createConfiguration(businessData)` - Creates injection config
- `inject(template, placeholders)` - Replaces placeholders
- `injectBusinessConfig(content, config)` - Injects business data

### 3. Generic Template Generator (`services/generic-template-generator.js`)
**Purpose:** Orchestrate the cleaning and injection process
**Methods:**
- `validateConfig(config)` - Validates business configuration
- `generateFromTemplate(config)` - Full generation workflow

### 4. Category Manager (`services/category-manager.js`)
**Purpose:** Manage product categories dynamically
**Methods:**
- `loadFromObject(data)` - Load categories
- `getAll()`, `getTree()` - Retrieve categories
- `createDefaultConfig(type)` - Generate default categories

## Current Workflow (Broken)

```
User Requirements
    ↓
Claude AI (generates customizations)
    ↓
Template Manager (copies template AS-IS) ← PROBLEM: Contains spice data
    ↓
Code Customizer (applies changes)
    ↓
UI Customizer (applies styling)
    ↓
Generated App (still has spice content)
```

## Proposed Workflow (Fixed)

### One-Time Setup (Run Once, Commit to Git):
```
Original Spice Template
    ↓
Template Cleaner (removes ALL hardcoded content)
    ↓
Generic Template with Placeholders
    ↓
Commit to Git (templates/generic-template/)
```

### Runtime Workflow (Every App Generation):
```
User Requirements
    ↓
Claude AI (generates customizations)
    ↓
Template Manager (copies pre-cleaned generic template from Git)
    ↓
Content Injector (injects new business data into placeholders)
    ↓
Code Customizer (applies additional changes)
    ↓
UI Customizer (applies styling)
    ↓
Generated App (fully customized, no spice content)
```

**Key Point:** Template cleaning happens ONCE during setup, not during each generation. The cleaned generic template is stored in Git and reused for all generations.

## Implementation Plan

### Phase 1: Prepare Generic Template (ONE-TIME ONLY - Commit to Git)

**Goal:** Create a cleaned, generic version of the template that will be stored in Git

**Important:** This step runs ONCE during initial setup, then the cleaned template is committed to Git and reused forever.

**Steps:**
1. Create script: `scripts/create-generic-template.js`
2. Run template-cleaner on the source template
3. Replace all business-specific content with placeholders:
   - `{{BUSINESS_NAME}}` - Company name
   - `{{BUSINESS_TAGLINE}}` - Tagline
   - `{{PRODUCT_TYPE}}` - Product type (singular)
   - `{{PRODUCT_TYPE_PLURAL}}` - Product type (plural)
   - `{{CATEGORY_*}}` - Category names
   - `{{DESCRIPTION}}` - Business description
4. Save cleaned template to `templates/generic-template/`
5. **Commit to Git** - This is crucial!
6. Validate all placeholders are present

**Files to Clean:**
- `frontend/src/pages/Home.js` - Hero section, descriptions
- `frontend/src/components/Navbar.js` - Company name, logo
- `frontend/src/components/Footer.js` - Company info
- `frontend/public/index.html` - Meta tags, title
- `backend/models/Product.js` - Product schema
- `backend/seed.js` - Sample data
- `README.md` - Documentation

**After This Phase:**
- Generic template exists in `templates/generic-template/`
- Generic template is committed to Git
- Future deployments pull the cleaned template from Git
- Template cleaning never runs again during app generation

### Phase 2: Update Template Manager

**Goal:** Always use the pre-cleaned generic template from Git

**Changes to `services/template-manager.js`:**

```javascript
class TemplateManager {
  constructor() {
    this.templatePath = config.template.localPath; // Original spice template
    this.genericTemplatePath = path.join(__dirname, '../templates/generic-template');
    // Always use generic template - it's already cleaned and in Git
  }

  async initialize() {
    // Check if generic template exists in Git
    if (!await fs.pathExists(this.genericTemplatePath)) {
      throw new Error(
        'Generic template not found! Run: node scripts/create-generic-template.js'
      );
    }
    
    console.log('✅ Using pre-cleaned generic template from Git');
    this.isInitialized = true;
  }

  async copyTemplate(destination) {
    // ALWAYS copy from generic template (already cleaned, in Git)
    await fs.copy(this.genericTemplatePath, destination, {
      filter: (src) => {
        // Exclude .git, node_modules, etc.
        return !src.includes('node_modules') && !src.includes('.git');
      }
    });
    
    console.log('✅ Copied pre-cleaned generic template');
  }
}
```

**Key Changes:**
- Remove template cleaning logic from runtime
- Always use `genericTemplatePath` (from Git)
- Throw error if generic template doesn't exist
- No dynamic template creation during generation

### Phase 3: Update App Generator

**Goal:** Integrate template cleaning and content injection

**Changes to `services/app-generator.js`:**

```javascript
const TemplateCleaner = require('./template-cleaner');
const ContentInjector = require('./content-injector');
const CategoryManager = require('./category-manager');

class AppGenerator {
  constructor() {
    // Existing...
    this.templateCleaner = new TemplateCleaner();
    this.contentInjector = new ContentInjector();
    this.categoryManager = new CategoryManager();
  }

  async generateApp(params) {
    // ... existing steps 1-3 ...

    // NEW STEP 3.5: Inject business content into copied template
    console.log('📝 Step 3.5: Injecting business content...');
    await this.injectBusinessContent(appPath, customizations, params);

    // ... continue with existing steps 4-7 ...
  }

  async injectBusinessContent(appPath, customizations, params) {
    // Create configuration from customizations
    const config = this.contentInjector.createConfiguration({
      businessName: customizations.appName,
      tagline: customizations.brandingChanges.tagline,
      productType: customizations.businessType,
      description: params.userRequirements.substring(0, 200),
      categories: customizations.productCategories
    });

    // Load categories
    this.categoryManager.loadFromObject({
      categories: customizations.productCategories.map((cat, i) => ({
        id: cat.toLowerCase().replace(/\s+/g, '-'),
        name: cat,
        order: i + 1
      }))
    });

    // Inject content into key files
    const filesToInject = [
      'frontend/src/pages/Home.js',
      'frontend/src/components/Navbar.js',
      'frontend/src/components/Footer.js',
      'frontend/public/index.html',
      'README.md'
    ];

    for (const file of filesToInject) {
      const filePath = path.join(appPath, file);
      if (await fs.pathExists(filePath)) {
        let content = await fs.readFile(filePath, 'utf8');
        content = this.contentInjector.injectBusinessConfig(content, config.business);
        await fs.writeFile(filePath, content, 'utf8');
      }
    }
  }
}
```

### Phase 4: Update Code Customizer

**Goal:** Work with generic placeholders

**Changes to `services/code-customizer.js`:**

Ensure it doesn't reintroduce hardcoded content:
- Check for remaining placeholders before applying changes
- Use configuration data instead of hardcoded values
- Validate no business-specific content in changes

### Phase 5: Testing Strategy

**Test Cases:**

1. **Test Generic Template Creation**
   ```bash
   node test-create-generic-template.js
   ```
   - Verify all placeholders exist
   - Verify no hardcoded business content
   - Validate template structure intact

2. **Test Content Injection**
   ```bash
   node test-content-injection.js
   ```
   - Generate app with bookstore requirements
   - Verify "Page Turner Books" appears (not spices)
   - Verify book categories (not spice categories)
   - Check all pages for correct content

3. **Test Multiple Business Types**
   - Generate coffee shop
   - Generate bookstore
   - Generate clothing store
   - Verify each has correct content

4. **Regression Test**
   - Ensure existing functionality still works
   - Verify Claude AI integration
   - Check environment generation
   - Test UI customization

### Phase 6: Validation Checklist

**Before Deployment:**

- [ ] Generic template created and validated
- [ ] No hardcoded "spice" content in generic template
- [ ] All placeholders properly defined
- [ ] Template Manager uses generic template
- [ ] App Generator injects content correctly
- [ ] Generated apps have correct business names
- [ ] Generated apps have correct product types
- [ ] Generated apps have correct categories
- [ ] No placeholder text visible in generated apps
- [ ] All existing features still work
- [ ] Documentation updated

## File Changes Required

### New Files:
1. `templates/generic-template/` - Cleaned template directory
2. `scripts/create-generic-template.js` - One-time template cleaning script
3. `test-generic-integration.js` - Integration test

### Modified Files:
1. `services/app-generator.js` - Add content injection step
2. `services/template-manager.js` - Support generic template
3. `services/code-customizer.js` - Work with placeholders
4. `config/index.js` - Add generic template config

### Files to Clean (in source template):
1. `frontend/src/pages/Home.js`
2. `frontend/src/components/Navbar.js`
3. `frontend/src/components/Footer.js`
4. `frontend/public/index.html`
5. `backend/models/Product.js`
6. `backend/seed.js`
7. `README.md`

## Implementation Order

1. ✅ **Create generic template cleaning script** (1 hour)
2. ✅ **Run script to generate generic template** (30 min)
3. ✅ **Update Template Manager** (1 hour)
4. ✅ **Update App Generator with injection** (2 hours)
5. ✅ **Test with bookstore example** (1 hour)
6. ✅ **Fix any issues found** (2 hours)
7. ✅ **Test with multiple business types** (1 hour)
8. ✅ **Update documentation** (30 min)

**Total Estimated Time:** 8-10 hours

## Success Criteria

✅ Generated apps have NO hardcoded spice content  
✅ Business name appears correctly throughout app  
✅ Product types match requirements  
✅ Categories match requirements  
✅ Sample data matches business type  
✅ All placeholders replaced  
✅ Existing features still work  
✅ Generation time remains under 60 seconds  

## Rollback Plan

If issues occur:
1. Set `useGenericTemplate = false` in Template Manager
2. Service falls back to original template
3. Fix issues in generic template
4. Re-enable generic template

## Next Steps

1. Review and approve this plan
2. Switch to Code mode for implementation
3. Execute phases 1-6 in order
4. Test thoroughly before deployment
5. Update production service

---

**Status:** Ready for Implementation  
**Priority:** High  
**Complexity:** Medium  
**Risk:** Low (has rollback plan)
