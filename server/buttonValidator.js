/**
 * SiteForge AI — Comprehensive Button & Link Validation System
 * Analyzes interactivity, link validity, event bindings, and button styling UX.
 */

const SEVERITY = { ERROR: 'error', WARN: 'warn', INFO: 'info' };

function issue(file, severity, code, message, fix = null, line = null) {
  return { file, severity, code, message, fix, line, timestamp: new Date().toISOString() };
}

function analyzeButtons(files) {
  const issues = [];
  const html = files['index.html'] || '';
  const css = files['styles.css'] || '';
  const js = files['scripts.js'] || '';

  if (!html) return issues;

  // 1. Build Document Model
  const allIds = Array.from(html.matchAll(/(?:id)\s*=\s*['"]([^'"]+)['"]/gi)).map(m => m[1]);
  const anchorRegex = /<a\s+[^>]*href\s*=\s*['"]([^'"]+)['"][^>]*>/gi;
  const buttonRegex = /<button\b([^>]*)>/gi;

  // 2. Internal Links Validation
  let aMatch;
  while ((aMatch = anchorRegex.exec(html)) !== null) {
    const href = aMatch[1];
    if (href.startsWith('#') && href.length > 1) {
      const targetId = href.substring(1);
      if (!allIds.includes(targetId)) {
        issues.push(issue('index.html', SEVERITY.ERROR, 'BTN001',
          `Broken Link: Anchor points to href="#${targetId}", but no element with id="${targetId}" exists on the page.`,
          `fix_broken_link_${targetId}`));
      }
    } else if (href === '#' || href === '') {
      // Empty href - handled partly by debugEngine, but we will assert it here for buttons.
      const classAttrMatch = aMatch[0].match(/class\s*=\s*['"]([^'"]+)['"]/i);
      if (classAttrMatch && classAttrMatch[1].includes('btn')) {
        issues.push(issue('index.html', SEVERITY.WARN, 'BTN002',
          `Button Link (class="btn") has empty href="#". If it's performing a JS action, use a <button> tag instead for accessibility.`,
          null));
      }
    }
  }

  // 3. Button Functionality Validation
  let bMatch;
  while ((bMatch = buttonRegex.exec(html)) !== null) {
    const attrs = bMatch[1];
    
    // Check type explicitly
    if (!/\btype\s*=\s*['"](button|submit|reset)['"]/i.test(attrs)) {
      issues.push(issue('index.html', SEVERITY.WARN, 'BTN003',
        `A <button> is missing an explicit type="" attribute. It defaults to "submit", which may accidentally submit forms.`,
        'inject_button_types'));
    }

    // Check interaction binding if type="button"
    if (/\btype\s*=\s*['"]button['"]/i.test(attrs) || !attrs.includes('type')) {
      const idMatch = attrs.match(/\bid\s*=\s*['"]([^'"]+)['"]/i);
      const classMatch = attrs.match(/\bclass\s*=\s*['"]([^'"]+)['"]/i);
      
      let hasBinding = false;
      if (idMatch && js.includes(idMatch[1])) hasBinding = true;
      
      // Basic check for classes used in JS querySelectors
      if (!hasBinding && classMatch) {
         const classes = classMatch[1].split(/\s+/);
         for (const cls of classes) {
             if (js.includes(`.${cls}`) && cls !== 'btn' && cls !== 'btn-primary') {
                 hasBinding = true;
             }
         }
      }
      
      // If it has no known JS binding, isn't a mobile-menu-btn (usually standard), and isn't inside a form...
      if (!hasBinding && !attrs.includes('mobile-menu') && !/\btype\s*=\s*['"]submit['"]/i.test(attrs)) {
          // Warning for potentially dead buttons
          issues.push(issue('scripts.js', SEVERITY.INFO, 'BTN004',
            `Button found in HTML that might not have an event listener bound in scripts.js. Verify it actually performs an action.`,
            null));
      }
    }
  }

  // 4. Button Styling UX Validation
  if (css) {
    // Missing hover states
    if (!css.includes(':hover') && (css.includes('.btn') || css.includes('button'))) {
      issues.push(issue('styles.css', SEVERITY.WARN, 'BTN005',
        `Buttons lack :hover pseudo-classes. Users will not get interactive feedback on mouseover.`,
        'inject_button_hover'));
    }

    // Missing transition
    if (css.includes('.btn {') && !css.match(/\.btn\s*\{[^}]*transition:/i)) {
      issues.push(issue('styles.css', SEVERITY.WARN, 'BTN006',
        `Buttons (.btn) are missing a CSS transition property, resulting in jarring state changes.`,
        'inject_button_transition'));
    }
  }

  return issues;
}

function autoFixButtons(files, issues) {
  let html = files['index.html'] || '';
  let css = files['styles.css'] || '';
  const fixLog = [];
  const fixCodes = new Set(issues.map(i => i.fix).filter(Boolean));

  // Fix broken links (BTN001) - inject missing IDs into obvious sections
  for (const fix of Array.from(fixCodes)) {
    if (fix.startsWith('fix_broken_link_')) {
      const targetId = fix.replace('fix_broken_link_', '');
      
      // Check if there is `<section class="[targetId]">` without an id
      const sectionRegex = new RegExp(`<section\\s+class\\s*=\\s*['"]([^'"]*?\\b${targetId}\\b[^'"]*)['"](?![^>]*id=)[^>]*>`, 'i');
      if (sectionRegex.test(html)) {
         html = html.replace(sectionRegex, (match) => {
             return match.replace('<section ', `<section id="${targetId}" `);
         });
         fixLog.push({ file: 'index.html', fix: fix, description: `Repaired broken link by injecting id="${targetId}" into matching section` });
      }
      // Or a generic `<div class="[targetId]">` near the top level
      else {
         const divRegex = new RegExp(`<div\\s+class\\s*=\\s*['"]([^'"]*?\\b${targetId}\\b[^'"]*)['"](?![^>]*id=)[^>]*>`, 'i');
         if (divRegex.test(html)) {
            html = html.replace(divRegex, (match) => {
                return match.replace('<div ', `<div id="${targetId}" `);
            });
            fixLog.push({ file: 'index.html', fix: fix, description: `Repaired broken link by injecting id="${targetId}" into matching div` });
         }
      }
    }
  }

  // Fix missing button types (BTN003)
  if (fixCodes.has('inject_button_types')) {
     html = html.replace(/<button(?!\s[^>]*type\s*=)([^>]*)>/gi, (match, attrs) => {
         // If inside form string context, guess 'submit'. Without full DOM parser, safer to default to "button".
         // Actually, standard AI layout adds "mobile-menu-btn" and carousel buttons which should be type="button".
         return `<button type="button"${attrs}>`;
     });
     fixLog.push({ file: 'index.html', fix: 'inject_button_types', description: 'Injected explicit type="button" to untyped <button> tags to prevent form-hijacking.' });
  }

  // Fix missing hover (BTN005)
  if (fixCodes.has('inject_button_hover')) {
     css += `\n/* SF-Debug UX: Global Button Hover States */\nbutton:hover, .btn:hover { cursor: pointer; filter: brightness(1.1); transform: translateY(-2px); }\nbutton:active, .btn:active { transform: translateY(0); }\n`;
     fixLog.push({ file: 'styles.css', fix: 'inject_button_hover', description: 'Injected interactive :hover and :active feedback states for all buttons.' });
  }

  // Fix missing transition (BTN006)
  if (fixCodes.has('inject_button_transition')) {
     css = css.replace(/(\.btn\s*\{[^}]*)\}/i, '$1  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}');
     fixLog.push({ file: 'styles.css', fix: 'inject_button_transition', description: 'Injected smooth transition timing for .btn pseudo-classes.' });
  }

  return { files: { ...files, 'index.html': html, 'styles.css': css }, fixLog };
}

module.exports = { analyzeButtons, autoFixButtons };
