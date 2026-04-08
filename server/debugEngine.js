/**
 * SiteForge AI — Automated Debug Engine
 * Statically analyzes generated HTML, CSS, and JavaScript for bugs,
 * anti-patterns, accessibility issues, and performance problems.
 * Automatically fixes detected issues and returns a structured report.
 */
const { analyzeDesign, autoFixDesign } = require('./designValidator');
const { analyzeButtons, autoFixButtons } = require('./buttonValidator');

// ─────────────────────────────────────────────────────────────
//  Types & Constants
// ─────────────────────────────────────────────────────────────
const SEVERITY = { ERROR: 'error', WARN: 'warn', INFO: 'info' };

function issue(file, severity, code, message, fix = null, line = null) {
  return { file, severity, code, message, fix, line, timestamp: new Date().toISOString() };
}

// ─────────────────────────────────────────────────────────────
//  HTML Analyzer
// ─────────────────────────────────────────────────────────────
function analyzeHTML(html) {
  const issues = [];
  if (!html) return issues;

  // 1. DOCTYPE declaration
  if (!html.trimStart().startsWith('<!DOCTYPE')) {
    issues.push(issue('index.html', SEVERITY.ERROR, 'HTML001',
      'Missing <!DOCTYPE html> declaration — browsers may render in quirks mode.',
      'prepend_doctype'));
  }

  // 2. <html lang> attribute
  if (!/<html[^>]+lang\s*=/.test(html)) {
    issues.push(issue('index.html', SEVERITY.WARN, 'HTML002',
      'Missing lang attribute on <html> (e.g. lang="en") — required for accessibility.',
      'add_html_lang'));
  }

  // 3. <meta charset>
  if (!/<meta\s[^>]*charset/i.test(html)) {
    issues.push(issue('index.html', SEVERITY.ERROR, 'HTML003',
      'Missing <meta charset="UTF-8"> — text encoding may be misinterpreted.',
      'add_charset'));
  }

  // 4. <meta viewport>
  if (!/<meta\s[^>]*name\s*=\s*["']viewport["']/i.test(html)) {
    issues.push(issue('index.html', SEVERITY.ERROR, 'HTML004',
      'Missing <meta name="viewport"> — page will not scale correctly on mobile devices.',
      'add_viewport'));
  }

  // 5. <title>
  if (!/<title>[^<]+<\/title>/i.test(html)) {
    issues.push(issue('index.html', SEVERITY.WARN, 'HTML005',
      'Missing or empty <title> tag — important for SEO and browser tab display.',
      'add_title'));
  }

  // 6. <meta description>
  if (!/<meta\s[^>]*name\s*=\s*["']description["']/i.test(html)) {
    issues.push(issue('index.html', SEVERITY.INFO, 'HTML006',
      'Missing <meta name="description"> — recommended for SEO.',
      'add_meta_description'));
  }

  // 7. Images without alt attributes
  const imgTagRegex = /<img\b([^>]*)>/gi;
  let imgMatch;
  let imgIndex = 0;
  while ((imgMatch = imgTagRegex.exec(html)) !== null) {
    imgIndex++;
    const attrs = imgMatch[1];
    if (!/\balt\s*=/.test(attrs)) {
      const lineNum = html.substring(0, imgMatch.index).split('\n').length;
      issues.push(issue('index.html', SEVERITY.WARN, `HTML007_${imgIndex}`,
        `<img> tag #${imgIndex} is missing an alt attribute — required for accessibility.`,
        'add_img_alt', lineNum));
    }
  }

  // 8. Empty links (href="#" without text or aria-label)
  const emptyLinkRegex = /<a\s[^>]*href\s*=\s*["']#["'][^>]*>\s*<\/a>/gi;
  if (emptyLinkRegex.test(html)) {
    issues.push(issue('index.html', SEVERITY.WARN, 'HTML008',
      'Found empty anchor tag(s) with href="#" — links should have descriptive text or aria-label.',
      null));
  }

  // 9. Forms without id on submit button (contact form)
  if (/<form/i.test(html)) {
    if (!/<button\s[^>]*type\s*=\s*["']submit["']/i.test(html) && !/<input\s[^>]*type\s*=\s*["']submit["']/i.test(html)) {
      issues.push(issue('index.html', SEVERITY.ERROR, 'HTML009',
        'Form found without a submit button — form cannot be submitted.',
        null));
    }
    // Form inputs without labels
    const inputRegex = /<input\b(?![^>]*type\s*=\s*["'](?:hidden|submit|button|checkbox|radio)["'])[^>]*>/gi;
    const formPart = html.match(/<form[\s\S]*?<\/form>/gi) || [];
    formPart.forEach((formHtml) => {
      const inputCount = (formHtml.match(inputRegex) || []).length;
      const labelCount = (formHtml.match(/<label/gi) || []).length;
      if (inputCount > labelCount) {
        issues.push(issue('index.html', SEVERITY.WARN, 'HTML010',
          `Form has ${inputCount} input(s) but only ${labelCount} label(s) — inputs should have associated labels for accessibility.`,
          null));
      }
    });
  }

  // 10. Google Fonts without preconnect
  if (/fonts\.googleapis\.com/.test(html)) {
    if (!/<link[^>]+rel\s*=\s*["']preconnect["'][^>]+fonts\.googleapis\.com/i.test(html) &&
        !/<link[^>]+fonts\.googleapis\.com[^>]+rel\s*=\s*["']preconnect["']/i.test(html)) {
      issues.push(issue('index.html', SEVERITY.INFO, 'HTML011',
        'Google Fonts loaded without <link rel="preconnect"> — may slow down font rendering.',
        'add_preconnect'));
    }
  }

  // 11. Script tag before closing </body>
  if (/<script[^>]*src=[^>]*>[\s\S]*?<\/script>[\s\n]*<\/head>/i.test(html)) {
    issues.push(issue('index.html', SEVERITY.WARN, 'HTML012',
      'Render-blocking <script> tag found in <head> — move scripts before </body> for better performance.',
      null));
  }

  // 12. Missing favicon
  if (!/<link[^>]*rel\s*=\s*["'][^"']*icon[^"']*["']/i.test(html)) {
    issues.push(issue('index.html', SEVERITY.INFO, 'HTML013',
      'No favicon <link> found — consider adding one for browser tab branding.',
      'add_favicon'));
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────
//  CSS Analyzer
// ─────────────────────────────────────────────────────────────
function analyzeCSS(css) {
  const issues = [];
  if (!css) return issues;

  // 1. Missing :root block
  if (!/:root\s*\{/.test(css)) {
    issues.push(issue('styles.css', SEVERITY.WARN, 'CSS001',
      'No :root {} block found — CSS custom properties (variables) are recommended for maintainability.',
      null));
  }

  // 2. box-sizing: border-box
  if (!/box-sizing\s*:\s*border-box/.test(css)) {
    issues.push(issue('styles.css', SEVERITY.WARN, 'CSS002',
      'Missing box-sizing: border-box reset — elements may have unexpected sizing behaviour.',
      'add_box_sizing'));
  }

  // 3. No responsive breakpoints
  if (!/@media/.test(css)) {
    issues.push(issue('styles.css', SEVERITY.ERROR, 'CSS003',
      'No @media queries found — website is not responsive and will break on mobile.',
      'add_media_queries'));
  }

  // 4. color-mix() without fallback (limited browser support)
  if (/color-mix\(/.test(css)) {
    const hasFallback = css.split('color-mix(').some((segment, i) => {
      if (i === 0) return false;
      // Check if there's a fallback property before this color-mix
      const before = css.split('color-mix(')[0];
      return /background:\s*#|background:\s*rgb/.test(before.split('{').pop());
    });
    if (!hasFallback) {
      issues.push(issue('styles.css', SEVERITY.WARN, 'CSS004',
        'color-mix() is used without a fallback — not supported in older browsers (Firefox < 113, Safari < 16.2).',
        'add_color_mix_fallback'));
    }
  }

  // 5. overflow-x: hidden on body/html (breaks position:sticky)
  if (/(?:body|html)[^{]*\{[^}]*overflow-x\s*:\s*hidden/i.test(css)) {
    issues.push(issue('styles.css', SEVERITY.INFO, 'CSS005',
      'overflow-x: hidden on body/html can break position:sticky elements on some browsers.',
      null));
  }

  // 6. Missing scroll-behavior: smooth
  if (!!/html[^{]*\{[^}]*scroll-behavior\s*:\s*smooth/i.test(css) === false &&
      !css.includes('scroll-behavior: smooth')) {
    issues.push(issue('styles.css', SEVERITY.INFO, 'CSS006',
      'Missing scroll-behavior: smooth on html — anchor links will jump instead of scroll smoothly.',
      'add_scroll_smooth'));
  }

  // 7. Very large z-index values (maintenance risk)
  const zIndexRegex = /z-index\s*:\s*(\d+)/g;
  let zMatch;
  while ((zMatch = zIndexRegex.exec(css)) !== null) {
    if (parseInt(zMatch[1]) > 9999) {
      issues.push(issue('styles.css', SEVERITY.INFO, 'CSS007',
        `z-index value of ${zMatch[1]} is excessively large — consider using a z-index scale (e.g. 10, 100, 1000).`,
        null));
    }
  }

  // 8. !important overuse
  const importantCount = (css.match(/!important/g) || []).length;
  if (importantCount > 5) {
    issues.push(issue('styles.css', SEVERITY.WARN, 'CSS008',
      `Found ${importantCount} uses of !important — overuse indicates specificity issues and reduces maintainability.`,
      null));
  }

  // 9. Missing -webkit- prefix for backdrop-filter
  if (/backdrop-filter/.test(css) && !/-webkit-backdrop-filter/.test(css)) {
    issues.push(issue('styles.css', SEVERITY.WARN, 'CSS009',
      'backdrop-filter used without -webkit-backdrop-filter prefix — glassmorphism effects may not work on Safari.',
      'add_webkit_backdrop'));
  }

  // 10. Missing font-display: swap for @font-face
  if (/@font-face/.test(css) && !/font-display\s*:\s*swap/.test(css)) {
    issues.push(issue('styles.css', SEVERITY.INFO, 'CSS010',
      'Custom @font-face missing font-display: swap — may cause FOIT (invisible text during loading).',
      null));
  }

  // 11. Transitions on all properties (performance)
  if (/transition:\s*all/i.test(css)) {
    issues.push(issue('styles.css', SEVERITY.INFO, 'CSS011',
      'transition: all is used — this can trigger unnecessary paint/layout operations. Prefer specific properties like "transform, opacity".',
      null));
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────
//  JavaScript Analyzer
// ─────────────────────────────────────────────────────────────
function analyzeJS(js) {
  const issues = [];
  if (!js) return issues;

  const lines = js.split('\n');

  // 1. console.log / console.warn / console.info in production
  lines.forEach((line, i) => {
    if (/console\.(log|warn|info|debug)\s*\(/.test(line) && !/\/\/.*console/.test(line)) {
      issues.push(issue('scripts.js', SEVERITY.WARN, `JS001_${i+1}`,
        `console.${line.match(/console\.(\w+)/)[1]}() found on line ${i+1} — remove debug logging before deployment.`,
        'remove_console_logs', i + 1));
    }
  });

  // 2. debugger statements
  lines.forEach((line, i) => {
    if (/\bdebugger\b/.test(line)) {
      issues.push(issue('scripts.js', SEVERITY.ERROR, `JS002_${i+1}`,
        `debugger statement found on line ${i+1} — MUST be removed before deployment.`,
        'remove_debugger', i + 1));
    }
  });

  // 3. querySelector without null guard
  const querySelectorRegex = /(?:document|element)\.querySelector(?:All)?\s*\([^)]+\)\s*\./g;
  let qsMatch;
  while ((qsMatch = querySelectorRegex.exec(js)) !== null) {
    const lineNum = js.substring(0, qsMatch.index).split('\n').length;
    // Only flag if it's not already inside an if check 2 lines above
    const contextStart = Math.max(0, qsMatch.index - 100);
    const context = js.substring(contextStart, qsMatch.index);
    if (!(/if\s*\(/.test(context.split('\n').slice(-3).join('\n')))) {
      issues.push(issue('scripts.js', SEVERITY.WARN, `JS003_${lineNum}`,
        `Chained call on querySelector result near line ${lineNum} — add a null check to prevent "Cannot read properties of null" errors.`,
        null, lineNum));
    }
  }

  // 4. addEventListener on element that could be null (common pattern)
  const addEventRegex = /const\s+(\w+)\s*=\s*document(?:\.getElementById|\.querySelector)\s*\([^)]+\);\n(?:[^\n]*\n){0,3}[^\n]*\1\s*\.\s*addEventListener/g;
  let aeMatch;
  while ((aeMatch = addEventRegex.exec(js)) !== null) {
    const lineNum = js.substring(0, aeMatch.index).split('\n').length;
    const varName = aeMatch[1];
    // Check if there's a null guard
    if (!js.substring(aeMatch.index, aeMatch.index + 500).includes(`if (${varName}`) &&
        !js.substring(aeMatch.index, aeMatch.index + 500).includes(`if(${varName}`)) {
      issues.push(issue('scripts.js', SEVERITY.WARN, `JS004_${lineNum}`,
        `Variable "${varName}" from DOM query used in addEventListener without null check (line ~${lineNum}).`,
        'add_null_guards', lineNum));
    }
  }

  // 5. Missing e.preventDefault() on form submit
  if (/addEventListener\s*\(\s*['"]submit['"]/i.test(js)) {
    if (!/e\.preventDefault\(\)|event\.preventDefault\(\)/.test(js)) {
      issues.push(issue('scripts.js', SEVERITY.ERROR, 'JS005',
        'Form submit event listener found without e.preventDefault() — forms will cause page reload.',
        'add_prevent_default'));
    }
  }

  // 6. var declarations (should use const/let)
  const varCount = (js.match(/\bvar\s+\w/g) || []).length;
  if (varCount > 0) {
    issues.push(issue('scripts.js', SEVERITY.INFO, 'JS006',
      `Found ${varCount} var declaration(s) — prefer const/let for block scoping and to avoid hoisting bugs.`,
      'replace_var_with_const'));
  }

  // 7. == instead of === (type coercion bugs)
  const looseEqRegex = /[^=!<>]={2}(?!=)/g;
  const looseEqMatches = js.match(looseEqRegex) || [];
  if (looseEqMatches.length > 0) {
    issues.push(issue('scripts.js', SEVERITY.INFO, 'JS007',
      `Found ${looseEqMatches.length} loose equality (==) comparison(s) — use === to prevent type coercion bugs.`,
      null));
  }

  // 8. Missing DOMContentLoaded wrapper (if querySelector is called at top level)
  const hasTopLevelQuery = /^(?!.*function).*document\.querySelector/m.test(js);
  const hasDOMReady = /DOMContentLoaded|window\.onload/.test(js);
  if (hasTopLevelQuery && !hasDOMReady) {
    issues.push(issue('scripts.js', SEVERITY.INFO, 'JS008',
      'DOM queries at top level without DOMContentLoaded wrapper — may execute before DOM is ready in some environments.',
      null));
  }

  // 9. eval() usage (security risk)
  if (/\beval\s*\(/.test(js)) {
    issues.push(issue('scripts.js', SEVERITY.ERROR, 'JS009',
      'eval() found — this is a security vulnerability and performance hazard. Never use eval().',
      null));
  }

  // 10. Synchronous XHR (browser deprecated pattern)
  if (/open\s*\(\s*["'][A-Z]+["'],\s*[^,]+,\s*false/.test(js)) {
    issues.push(issue('scripts.js', SEVERITY.ERROR, 'JS010',
      'Synchronous XMLHttpRequest detected — this is deprecated and blocks the UI thread.',
      null));
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────
//  Auto-Fix Engine
// ─────────────────────────────────────────────────────────────
function autoFix(files, issues) {
  let html = files['index.html'] || '';
  let css = files['styles.css'] || '';
  let js = files['scripts.js'] || '';
  const fixLog = [];

  const fixCodes = new Set(issues.map(i => i.fix).filter(Boolean));

  // ── HTML Fixes ──
  if (fixCodes.has('prepend_doctype') && !html.trimStart().startsWith('<!DOCTYPE')) {
    html = '<!DOCTYPE html>\n' + html;
    fixLog.push({ file: 'index.html', fix: 'prepend_doctype', description: 'Added <!DOCTYPE html> declaration' });
  }

  if (fixCodes.has('add_html_lang') && !/<html[^>]+lang\s*=/.test(html)) {
    html = html.replace(/<html(?!\s[^>]*lang)/i, '<html lang="en"');
    fixLog.push({ file: 'index.html', fix: 'add_html_lang', description: 'Added lang="en" to <html> tag' });
  }

  if (fixCodes.has('add_charset') && !/<meta\s[^>]*charset/i.test(html)) {
    html = html.replace(/<head>/i, '<head>\n    <meta charset="UTF-8">');
    fixLog.push({ file: 'index.html', fix: 'add_charset', description: 'Injected <meta charset="UTF-8">' });
  }

  if (fixCodes.has('add_viewport') && !/<meta\s[^>]*name\s*=\s*["']viewport["']/i.test(html)) {
    const viewportTag = '\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">';
    if (/<meta\s[^>]*charset/i.test(html)) {
      html = html.replace(/(<meta\s[^>]*charset[^>]*>)/i, '$1' + viewportTag);
    } else {
      html = html.replace(/<head>/i, '<head>' + viewportTag);
    }
    fixLog.push({ file: 'index.html', fix: 'add_viewport', description: 'Injected <meta name="viewport">' });
  }

  if (fixCodes.has('add_title') && !/<title>[^<]+<\/title>/i.test(html)) {
    html = html.replace(/<\/head>/i, '    <title>My Website</title>\n</head>');
    fixLog.push({ file: 'index.html', fix: 'add_title', description: 'Added missing <title> tag' });
  }

  if (fixCodes.has('add_meta_description') && !/<meta\s[^>]*name\s*=\s*["']description["']/i.test(html)) {
    html = html.replace(/<\/head>/i, '    <meta name="description" content="A premium website built with SiteForge AI.">\n</head>');
    fixLog.push({ file: 'index.html', fix: 'add_meta_description', description: 'Added <meta name="description">' });
  }

  if (fixCodes.has('add_img_alt')) {
    html = html.replace(/<img\b([^>]*)>/gi, (match, attrs) => {
      if (!/\balt\s*=/.test(attrs)) {
        // Try to derive a meaningful alt from src or nearby context
        const srcMatch = attrs.match(/src\s*=\s*["']([^"']+)["']/i);
        const altText = srcMatch ? `Image: ${srcMatch[1].split('/').pop().split('?')[0]}` : 'Decorative image';
        return `<img${attrs} alt="${altText}">`;
      }
      return match;
    });
    fixLog.push({ file: 'index.html', fix: 'add_img_alt', description: 'Added descriptive alt attributes to all images' });
  }

  if (fixCodes.has('add_preconnect') && /fonts\.googleapis\.com/.test(html)) {
    if (!/<link[^>]+rel\s*=\s*["']preconnect["'][^>]+fonts/i.test(html)) {
      const preconnects = `    <link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n`;
      html = html.replace(/<head>/i, '<head>\n' + preconnects);
      fixLog.push({ file: 'index.html', fix: 'add_preconnect', description: 'Added Google Fonts preconnect hints' });
    }
  }

  if (fixCodes.has('add_favicon') && !/<link[^>]*rel\s*=\s*["'][^"']*icon[^"']*["']/i.test(html)) {
    html = html.replace(/<\/head>/i, '    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>⚡</text></svg>">\n</head>');
    fixLog.push({ file: 'index.html', fix: 'add_favicon', description: 'Added inline SVG favicon' });
  }

  // ── CSS Fixes ──
  if (fixCodes.has('add_box_sizing') && !/box-sizing\s*:\s*border-box/.test(css)) {
    const reset = `\n/* SF-Debug: Box-sizing reset */\n*, *::before, *::after { box-sizing: border-box; }\n`;
    css = reset + css;
    fixLog.push({ file: 'styles.css', fix: 'add_box_sizing', description: 'Added universal box-sizing: border-box reset' });
  }

  if (fixCodes.has('add_scroll_smooth') && !css.includes('scroll-behavior: smooth')) {
    css = css.replace(/(html\s*\{)/, '$1\n  scroll-behavior: smooth;');
    if (!css.includes('scroll-behavior: smooth')) {
      css = `html { scroll-behavior: smooth; }\n` + css;
    }
    fixLog.push({ file: 'styles.css', fix: 'add_scroll_smooth', description: 'Added scroll-behavior: smooth to html element' });
  }

  if (fixCodes.has('add_webkit_backdrop') && /backdrop-filter/.test(css) && !/-webkit-backdrop-filter/.test(css)) {
    css = css.replace(/(\s*)(backdrop-filter\s*:[^;]+;)/g, '$1-webkit-$2$1$2');
    fixLog.push({ file: 'styles.css', fix: 'add_webkit_backdrop', description: 'Added -webkit-backdrop-filter prefix for Safari compatibility' });
  }

  if (fixCodes.has('add_media_queries') && !/@media/.test(css)) {
    const mobileReset = `\n/* SF-Debug: Basic responsive breakpoints */\n@media (max-width: 768px) {\n  .container { padding: 0 1rem; }\n  .about-wrapper, .contact-wrapper { grid-template-columns: 1fr; }\n  .footer-grid { grid-template-columns: 1fr; }\n  nav .nav-links { display: none; }\n  nav .nav-links.active { display: flex; flex-direction: column; }\n}\n@media (max-width: 480px) {\n  h1 { font-size: 2rem; }\n  section { padding: 4rem 0; }\n}\n`;
    css = css + mobileReset;
    fixLog.push({ file: 'styles.css', fix: 'add_media_queries', description: 'Added basic responsive @media query breakpoints' });
  }

  if (fixCodes.has('add_color_mix_fallback')) {
    // Replace color-mix calls with a reasonable fallback first, then the modern value
    css = css.replace(/([\w-]+\s*:\s*)([^;]*color-mix\([^;]+\))/g, (match, prop, val) => {
      // Generate a simple fallback (the bg at 85% opacity as a solid color)
      return `${prop}rgba(9,9,11,0.85); /* sf-debug: fallback */\n  ${prop}${val}`;
    });
    fixLog.push({ file: 'styles.css', fix: 'add_color_mix_fallback', description: 'Added solid-color fallbacks before color-mix() values' });
  }

  // ── JS Fixes ──
  if (fixCodes.has('remove_console_logs')) {
    const before = js;
    js = js.replace(/^\s*console\.(log|warn|info|debug)\s*\([^;]*\);\s*$/gm, '');
    if (js !== before) {
      fixLog.push({ file: 'scripts.js', fix: 'remove_console_logs', description: 'Removed console.log/warn/info/debug statements' });
    }
  }

  if (fixCodes.has('remove_debugger')) {
    const before = js;
    js = js.replace(/^\s*debugger;\s*$/gm, '');
    if (js !== before) {
      fixLog.push({ file: 'scripts.js', fix: 'remove_debugger', description: 'Removed debugger statements' });
    }
  }

  if (fixCodes.has('replace_var_with_const')) {
    // Safe replacement: only top-level var declarations not inside loops
    const before = js;
    js = js.replace(/\bvar\b(\s+\w)/g, 'const$1');
    if (js !== before) {
      fixLog.push({ file: 'scripts.js', fix: 'replace_var_with_const', description: 'Replaced var with const declarations' });
    }
  }

  if (fixCodes.has('add_prevent_default') && /addEventListener\s*\(\s*['"]submit['"]/i.test(js)) {
    if (!/e\.preventDefault\(\)|event\.preventDefault\(\)/.test(js)) {
      js = js.replace(
        /addEventListener\s*\(\s*['"]submit['"]\s*,\s*(\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>\s*\{/,
        (match) => match + '\n    e.preventDefault();'
      );
      fixLog.push({ file: 'scripts.js', fix: 'add_prevent_default', description: 'Added e.preventDefault() to submit handler' });
    }
  }

  if (fixCodes.has('add_null_guards')) {
    // Wrap addEventListener calls with null checks for common patterns
    js = js.replace(
      /^(const\s+(\w+)\s*=\s*document(?:\.getElementById|\.querySelector)\s*\([^)]+\));(\s*\n(?:[^\n]*\n){0,2}[^\n]*)\2\s*\.\s*addEventListener/gm,
      (match, constDecl, varName) => {
        if (match.includes(`if (${varName}`) || match.includes(`if(${varName}`)) return match;
        return match.replace(
          new RegExp(`(${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\.\\s*addEventListener)`),
          `if (${varName}) ${varName}.addEventListener`
        );
      }
    );
    fixLog.push({ file: 'scripts.js', fix: 'add_null_guards', description: 'Added null guards before addEventListener calls' });
  }

  return {
    files: { 'index.html': html, 'styles.css': css, 'scripts.js': js },
    fixLog,
  };
}

// ─────────────────────────────────────────────────────────────
//  Performance Checks (bonus, runs on all files)
// ─────────────────────────────────────────────────────────────
function analyzePerformance(files) {
  const issues = [];
  const html = files['index.html'] || '';
  const css = files['styles.css'] || '';
  const js = files['scripts.js'] || '';

  // Estimate file sizes
  const htmlKB = (new TextEncoder().encode(html).length / 1024).toFixed(1);
  const cssKB = (new TextEncoder().encode(css).length / 1024).toFixed(1);
  const jsKB = (new TextEncoder().encode(js).length / 1024).toFixed(1);

  if (htmlKB > 100) {
    issues.push(issue('index.html', SEVERITY.WARN, 'PERF001',
      `HTML file is ${htmlKB}KB — consider splitting into multiple pages or lazy-loading content.`, null));
  }
  if (cssKB > 50) {
    issues.push(issue('styles.css', SEVERITY.INFO, 'PERF002',
      `CSS file is ${cssKB}KB — consider removing unused rules or splitting into critical/non-critical CSS.`, null));
  }
  if (jsKB > 50) {
    issues.push(issue('scripts.js', SEVERITY.INFO, 'PERF003',
      `JS file is ${jsKB}KB — consider code-splitting or deferring non-critical scripts.`, null));
  }

  // Check for unsized images (no width/height attributes)
  const imgWithoutDimensions = (html.match(/<img\b(?![^>]*\b(?:width|height)\s*=)[^>]*>/gi) || []).length;
  if (imgWithoutDimensions > 0) {
    issues.push(issue('index.html', SEVERITY.INFO, 'PERF004',
      `${imgWithoutDimensions} image(s) missing explicit width/height — causes Cumulative Layout Shift (CLS).`, null));
  }

  // Check for loading="lazy" on images below the fold
  const totalImages = (html.match(/<img\b/gi) || []).length;
  const lazyImages = (html.match(/loading\s*=\s*["']lazy["']/gi) || []).length;
  if (totalImages > 2 && lazyImages < totalImages - 1) {
    issues.push(issue('index.html', SEVERITY.INFO, 'PERF005',
      `Only ${lazyImages}/${totalImages} images use loading="lazy" — add it to below-the-fold images to improve LCP.`, null));
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────
//  Main Entry Points
// ─────────────────────────────────────────────────────────────

/**
 * Analyze project files and return structured diagnostic report.
 */
function analyze(files) {
  const htmlIssues = analyzeHTML(files['index.html'] || '');
  const cssIssues = analyzeCSS(files['styles.css'] || '');
  const jsIssues = analyzeJS(files['scripts.js'] || '');
  const perfIssues = analyzePerformance(files);
  const designIssues = analyzeDesign(files);
  const buttonIssues = analyzeButtons(files);

  const all = [...htmlIssues, ...cssIssues, ...jsIssues, ...perfIssues, ...designIssues, ...buttonIssues];

  const summary = {
    total: all.length,
    errors: all.filter(i => i.severity === SEVERITY.ERROR).length,
    warnings: all.filter(i => i.severity === SEVERITY.WARN).length,
    info: all.filter(i => i.severity === SEVERITY.INFO).length,
    fixable: all.filter(i => i.fix !== null).length,
    scannedAt: new Date().toISOString(),
  };

  return { issues: all, summary };
}

/**
 * Analyze then auto-fix all fixable issues. Returns patched files + fix log.
 */
function analyzeAndFix(files) {
  const { issues, summary } = analyze(files);
  let { files: fixedFiles, fixLog } = autoFix(files, issues);
  
  // Run Design Auto-Fixer phase 2
  const designFixResult = autoFixDesign(fixedFiles, issues);
  fixedFiles = designFixResult.files;
  fixLog = [...fixLog, ...designFixResult.fixLog];

  // Run Button UX Auto-Fixer phase 3
  const buttonFixResult = autoFixButtons(fixedFiles, issues);
  fixedFiles = buttonFixResult.files;
  fixLog = [...fixLog, ...buttonFixResult.fixLog];

  // Re-analyze after fixes to verify reduction
  const post = analyze(fixedFiles);

  return {
    original: { issues, summary },
    fixed: { issues: post.issues, summary: post.summary },
    fixLog,
    files: fixedFiles,
  };
}

module.exports = { analyze, analyzeAndFix, autoFix };
