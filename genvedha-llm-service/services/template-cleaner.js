/**
 * Template Cleaner Service
 * Removes specific content from generated templates to make them generic
 */

class TemplateCleaner {
  constructor() {
    // Patterns to remove or replace
    this.cleaningRules = {
      // Remove spice-specific content
      spiceContent: [
        /spice/gi,
        /masala/gi,
        /turmeric/gi,
        /cumin/gi,
        /coriander/gi,
        /cardamom/gi,
        /pepper/gi,
        /chili/gi,
        /garam masala/gi,
        /organic spice/gi
      ],
      
      // Remove specific business names
      businessNames: [
        /organic spice bazaar/gi,
        /spice bazaar/gi,
        /stylevista/gi
      ],
      
      // Remove hardcoded categories
      hardcodedCategories: [
        /"Whole Spices"/gi,
        /"Ground Spices"/gi,
        /"Spice Blends"/gi,
        /"Organic Spices"/gi
      ],
      
      // Remove specific product references
      productReferences: [
        /Organic Turmeric Powder/gi,
        /Premium Cumin Seeds/gi,
        /Garam Masala Blend/gi
      ]
    };
  }

  /**
   * Clean a file content
   * @param {string} content - File content to clean
   * @param {string} fileType - Type of file (js, jsx, html, etc.)
   * @returns {string} - Cleaned content
   */
  cleanContent(content, fileType = 'js') {
    let cleaned = content;

    // Apply cleaning rules based on file type
    if (fileType === 'js' || fileType === 'jsx') {
      cleaned = this.cleanJavaScriptContent(cleaned);
    } else if (fileType === 'html') {
      cleaned = this.cleanHTMLContent(cleaned);
    } else if (fileType === 'css') {
      cleaned = this.cleanCSSContent(cleaned);
    }

    return cleaned;
  }

  /**
   * Clean JavaScript/JSX content
   */
  cleanJavaScriptContent(content) {
    let cleaned = content;

    // Remove spice-specific imports
    cleaned = cleaned.replace(/import.*spice.*from.*;?\n/gi, '');

    // Replace spice-specific variable names with generic ones
    cleaned = cleaned.replace(/spiceProducts/g, 'products');
    cleaned = cleaned.replace(/spiceCategories/g, 'categories');
    cleaned = cleaned.replace(/spiceData/g, 'productData');

    // Remove hardcoded spice data
    cleaned = this.removeHardcodedData(cleaned);

    // Replace business-specific names with placeholders
    this.cleaningRules.businessNames.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '{{BUSINESS_NAME}}');
    });

    return cleaned;
  }

  /**
   * Clean HTML content
   */
  cleanHTMLContent(content) {
    let cleaned = content;

    // Remove spice-specific text
    this.cleaningRules.spiceContent.forEach(pattern => {
      cleaned = cleaned.replace(pattern, 'product');
    });

    // Replace business names
    this.cleaningRules.businessNames.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '{{BUSINESS_NAME}}');
    });

    return cleaned;
  }

  /**
   * Clean CSS content
   */
  cleanCSSContent(content) {
    let cleaned = content;

    // Remove business-specific class names
    cleaned = cleaned.replace(/\.spice-/g, '.product-');
    cleaned = cleaned.replace(/#spice-/g, '#product-');

    return cleaned;
  }

  /**
   * Remove hardcoded data arrays and objects
   */
  removeHardcodedData(content) {
    let cleaned = content;

    // Remove hardcoded product arrays
    const productArrayPattern = /const\s+products\s*=\s*\[[\s\S]*?\];/g;
    cleaned = cleaned.replace(productArrayPattern, 'const products = []; // Will be loaded dynamically');

    // Remove hardcoded category arrays
    const categoryArrayPattern = /const\s+categories\s*=\s*\[[\s\S]*?\];/g;
    cleaned = cleaned.replace(categoryArrayPattern, 'const categories = []; // Will be loaded from config');

    return cleaned;
  }

  /**
   * Clean an entire directory structure
   * @param {Object} fileStructure - Object containing file paths and contents
   * @returns {Object} - Cleaned file structure
   */
  cleanDirectory(fileStructure) {
    const cleaned = {};

    for (const [filePath, content] of Object.entries(fileStructure)) {
      const fileExtension = filePath.split('.').pop();
      cleaned[filePath] = this.cleanContent(content, fileExtension);
    }

    return cleaned;
  }

  /**
   * Remove specific content patterns
   * @param {string} content - Content to clean
   * @param {Array<RegExp>} patterns - Patterns to remove
   * @returns {string} - Cleaned content
   */
  removePatterns(content, patterns) {
    let cleaned = content;
    patterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    return cleaned;
  }

  /**
   * Replace content with placeholders
   * @param {string} content - Content to process
   * @param {Object} replacements - Map of patterns to placeholders
   * @returns {string} - Processed content
   */
  replaceWithPlaceholders(content, replacements) {
    let processed = content;
    
    for (const [pattern, placeholder] of Object.entries(replacements)) {
      const regex = new RegExp(pattern, 'gi');
      processed = processed.replace(regex, placeholder);
    }

    return processed;
  }

  /**
   * Validate cleaned content
   * @param {string} content - Content to validate
   * @returns {Object} - Validation result
   */
  validateCleanedContent(content) {
    const issues = [];

    // Check for remaining spice references (case-insensitive)
    this.cleaningRules.spiceContent.forEach(pattern => {
      // Reset regex lastIndex to avoid issues with global flag
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        issues.push(`Found remaining spice reference: ${pattern.source}`);
      }
    });

    // Check for hardcoded business names
    this.cleaningRules.businessNames.forEach(pattern => {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        issues.push(`Found hardcoded business name: ${pattern.source}`);
      }
    });

    return {
      isClean: issues.length === 0,
      issues
    };
  }
}

module.exports = new TemplateCleaner();
