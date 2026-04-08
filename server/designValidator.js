/**
 * SiteForge AI — Continuous Design Validation System
 * Analyzes HTML/CSS for aesthetic flaws, typographic scale, spacing consistency,
 * and layout alignment issues.
 */

const SEVERITY = { ERROR: 'error', WARN: 'warn', INFO: 'info' };

function issue(file, severity, code, message, fix = null, line = null) {
  return { file, severity, code, message, fix, line, timestamp: new Date().toISOString() };
}

function analyzeDesign(files) {
  const issues = [];
  const html = files['index.html'] || '';
  const css = files['styles.css'] || '';

  if (!html || !css) return issues;

  // Rule 1: Responsive Typography (Clamp)
  // Check if h1 or h2 are using fixed rem/px instead of clamp for fluid scaling
  const h1h2Regex = /(h1|h2)\s*\{[^}]*font-size\s*:\s*(?!clamp\()([0-9.]+)(rem|px)/gi;
  if (h1h2Regex.test(css)) {
    issues.push(issue('styles.css', SEVERITY.WARN, 'DESIGN001',
      'Heading typography is using fixed sizes instead of fluid clamp(). This can break on extreme screen sizes.',
      'fix_typography_clamp'));
  }

  // Rule 2: Section Spacing (Breathing Room)
  // Ensure sections have sufficient vertical padding
  const sectionPadding = css.match(/section\s*\{[^}]*padding\s*:\s*([0-9.]+)(rem|px)/i);
  if (sectionPadding) {
    const val = parseFloat(sectionPadding[1]);
    const unit = sectionPadding[2].toLowerCase();
    const isTooSmall = (unit === 'rem' && val < 4) || (unit === 'px' && val < 64);
    if (isTooSmall) {
      issues.push(issue('styles.css', SEVERITY.WARN, 'DESIGN002',
        `Section padding is too tight (${val}${unit}). Modern design requires at least 4rem/64px vertical spacing for hierarchy.`,
        'fix_section_padding'));
    }
  } else if (!css.includes('section { padding:') && !css.includes('section{padding:')) {
    issues.push(issue('styles.css', SEVERITY.WARN, 'DESIGN002',
      'Sections lack explicit vertical padding, leading to cramped layouts.',
      'add_section_padding'));
  }

  // Rule 3: Container Alignment
  // Ensure .container has generic auto-margins for bounding box
  if (css.includes('.container') && !css.includes('margin: 0 auto') && !css.includes('margin:0 auto') && !css.includes('margin-inline: auto')) {
    issues.push(issue('styles.css', SEVERITY.ERROR, 'DESIGN003',
      '.container element lacks margin:0 auto. The layout will stretch or misalign off-center.',
      'fix_container_alignment'));
  }

  // Rule 4: Layout Gaps (Flex/Grid)
  // If display: grid or flex is used in wrappers, ensure gap is provided
  const gridWithoutGap = /\{[^}]*display\s*:\s*(?:grid|flex)(?![^}]*gap\s*:)[^}]*\}/i;
  // Doing a coarse check here: if there's a lot of grid/flex but very few gaps
  const gridCount = (css.match(/display:\s*(grid|flex)/gi) || []).length;
  const gapCount = (css.match(/\bgap:\s*[0-9]/gi) || []).length;
  if (gridCount > gapCount + 2) { // Allow some flex/grid elements like Nav or Button to skip gap sometimes
    issues.push(issue('styles.css', SEVERITY.INFO, 'DESIGN004',
      'Multiple grid/flex layouts detected without gap properties. Elements may overlap or touch.',
      null));
  }

  // Rule 5: Image Aesthetics (Stretching)
  // Images inside grids/cards should use object-fit: cover to prevent aspect-ratio distortion
  if (!css.includes('object-fit: cover') && html.includes('<img')) {
    issues.push(issue('styles.css', SEVERITY.WARN, 'DESIGN005',
      'Images lack object-fit: cover constraints. They may stretch irregularly in responsive grids.',
      'fix_image_aspect_ratio'));
  }

  return issues;
}

function autoFixDesign(files, issues) {
  let css = files['styles.css'] || '';
  const fixLog = [];
  const fixCodes = new Set(issues.map(i => i.fix).filter(Boolean));

  if (fixCodes.has('fix_typography_clamp')) {
    css = css.replace(/(h1|h2)\s*\{([^}]*?)font-size\s*:\s*[0-9.]+(rem|px)([^}]*)\}/gi, '$1 {$2font-size: clamp(2.5rem, 5vw, 4rem)$4}');
    fixLog.push({ file: 'styles.css', fix: 'fix_typography_clamp', description: 'Upgraded typography to fluid clamp() scaling' });
  }

  if (fixCodes.has('fix_section_padding')) {
    css = css.replace(/section\s*\{([^}]*?)padding\s*:\s*[0-9.]+(rem|px)(\s+[0-9.]+(rem|px))?([^}]*)\}/i, (match, prefix, val1, u1, val2, u2, suffix) => {
       return `section {${prefix}padding: 6rem 0${suffix}}`;
    });
    fixLog.push({ file: 'styles.css', fix: 'fix_section_padding', description: 'Expanded section vertical padding for breathing room' });
  }

  if (fixCodes.has('add_section_padding')) {
    css += `\nsection { padding: 6rem 0; width: 100%; position: relative; overflow: hidden; }\n`;
    fixLog.push({ file: 'styles.css', fix: 'add_section_padding', description: 'Injected base section padding and overflow rules' });
  }

  if (fixCodes.has('fix_container_alignment')) {
    css = css.replace(/\.container\s*\{([^}]*)\}/, (match, body) => {
      if (!body.includes('margin: 0 auto')) return `.container {${body} margin: 0 auto; }`;
      return match;
    });
    fixLog.push({ file: 'styles.css', fix: 'fix_container_alignment', description: 'Centered container with auto margins' });
  }

  if (fixCodes.has('fix_image_aspect_ratio')) {
    css += `\n/* SF-Design: Image normalization */\nimg { max-width: 100%; height: auto; object-fit: cover; display: block; border-radius: inherit; }\n`;
    fixLog.push({ file: 'styles.css', fix: 'fix_image_aspect_ratio', description: 'Forced object-fit: cover on all loose images to prevent stretching' });
  }

  return { files: { ...files, 'styles.css': css }, fixLog };
}

module.exports = { analyzeDesign, autoFixDesign };
