import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Builds the shared CSS for all pages.
 */
function generateCSS(palette, fonts) {
  return `
:root {
    --primary: ${palette.primary};
    --secondary: ${palette.secondary};
    --bg: ${palette.bg};
    --surface: ${palette.surface};
    --text: ${palette.text};
    --accent: ${palette.accent};
    --font-heading: '${fonts.heading}', sans-serif;
    --font-body: '${fonts.body}', sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body { background-color: var(--bg); color: var(--text); font-family: var(--font-body); line-height: 1.6; overflow-x: hidden; display: flex; flex-direction: column; min-height: 100vh; }
main { flex: 1; margin-top: 70px; }
h1, h2, h3, h4 { font-family: var(--font-heading); line-height: 1.2; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
section { padding: 5rem 0; position: relative; }
.btn { display: inline-block; padding: 0.8rem 2rem; border-radius: 0.5rem; font-weight: 700; text-decoration: none; transition: all 0.3s ease; cursor: pointer; border: none; text-align: center; }
.btn-primary { background-color: var(--primary); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
.btn-outline { background-color: transparent; border: 1px solid rgba(255,255,255,0.2); color: var(--text); }

/* Navigation */
nav { position: fixed; top: 0; width: 100%; background: rgba(var(--bg), 0.95); backdrop-filter: blur(10px); z-index: 1000; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 1rem 0; height: 70px; display: flex; align-items: center; }
nav .container { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.nav-links { display: flex; gap: 2rem; }
.nav-links a { color: var(--text); text-decoration: none; font-weight: 600; opacity: 0.7; transition: opacity 0.3s; }
.nav-links a:hover, .nav-links a.active { opacity: 1; color: var(--primary); }

/* Components */
.hero { min-height: calc(100vh - 70px); display: flex; align-items: center; text-align: center; }
.hero h1 { font-size: clamp(2.5rem, 5vw, 4rem); margin-bottom: 1.5rem; }
.hero p { font-size: 1.25rem; opacity: 0.8; max-width: 700px; margin: 0 auto 2.5rem; }
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 3rem; }
.feature-card { background: var(--surface); padding: 2.5rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.05); transition: transform 0.3s; }
.feature-card:hover { transform: translateY(-5px); }
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
.gallery-item { border-radius: 1rem; overflow: hidden; height: 300px; background: var(--surface); }
.gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; cursor: pointer; }
.gallery-item img:hover { transform: scale(1.05); }

/* Forms */
form { display: flex; flex-direction: column; gap: 1rem; max-width: 500px; margin: 0 auto; }
input, textarea { background: var(--surface); border: 1px solid rgba(255,255,255,0.1); padding: 1rem; border-radius: 0.5rem; color: white; width: 100%; font-family: inherit; transition: border-color 0.3s; }
input:focus, textarea:focus { outline: none; border-color: var(--primary); }

/* Mobile */
@media (max-width: 768px) {
    .nav-links { display: none; } /* Add a hamburger menu in production */
    section { padding: 3rem 0; }
}
  `;
}

/**
 * Generates the shell HTML for a specific page.
 */
function generateHTMLShell(pageTitle, siteName, css, navLinks, contentHTML, footerHTML, fonts) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle} | ${siteName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${fonts.heading.replace(/\s/g, '+')}:wght@700;900&family=${fonts.body.replace(/\s/g, '+')}:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <nav>
        <div class="container">
            <a href="index.html" style="font-weight: 900; font-size: 1.5rem; color: var(--primary); text-decoration: none;">${siteName}</a>
            <div class="nav-links">
                ${navLinks.map(link => `<a href="${link.href}" class="${link.active ? 'active' : ''}">${link.label}</a>`).join('\n                ')}
            </div>
        </div>
    </nav>
    <main>
        ${contentHTML}
    </main>
    ${footerHTML}
    <script src="scripts.js"></script>
</body>
</html>`;
}

/**
 * Generates the shared JS file.
 */
function generateJS() {
  return `
// Shared Scripts
document.addEventListener('DOMContentLoaded', () => {
    // Handle form submissions dynamically
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'Sending...';
            btn.style.opacity = '0.7';
            
            // Simulate network request
            setTimeout(() => {
                btn.innerText = 'Message Sent!';
                btn.style.backgroundColor = 'var(--accent)';
                form.reset();
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = 'var(--primary)';
                    btn.style.opacity = '1';
                }, 3000);
            }, 1000);
        });
    });
});
  `;
}

export async function exportWebsite({ sections, palette, fonts, siteName, returnString = false }) {
  // 1. Group sections into logical pages
  const pagesData = {
    index: { title: 'Home', sections: [], href: 'index.html' },
    about: { title: 'About Us', sections: [], href: 'about.html' },
    gallery: { title: 'Gallery', sections: [], href: 'gallery.html' },
    contact: { title: 'Contact', sections: [], href: 'contact.html' }
  };

  let footerSection = null;

  sections.forEach(s => {
    if (s.type === 'footer') {
      footerSection = s;
    } else if (s.type === 'about') {
      pagesData.about.sections.push(s);
    } else if (s.type === 'gallery') {
      pagesData.gallery.sections.push(s);
    } else if (s.type === 'contact') {
      pagesData.contact.sections.push(s);
    } else {
      // hero, features, testimonials go to Home by default
      pagesData.index.sections.push(s);
    }
  });

  // Remove empty pages from nav
  const activePages = Object.entries(pagesData).filter(entry => entry[1].sections.length > 0);
  
  const footerHTML = footerSection ? renderSectionHTML(footerSection) : '';
  const css = generateCSS(palette, fonts);
  const js = generateJS();

  const generatedFiles = {};

  activePages.forEach(([pageKey, data]) => {
    const navLinks = activePages.map(([pk, pd]) => ({
      href: pd.href,
      label: pd.title,
      active: pk === pageKey
    }));
    
    const contentHTML = data.sections.map(s => renderSectionHTML(s, true)).join('\n');
    generatedFiles[data.href] = generateHTMLShell(data.title, siteName, css, navLinks, contentHTML, footerHTML, fonts);
  });

  // Fallback for visual code view (just show index.html code)
  if (returnString) {
    // Generate a single-page version for the "Code View" in the editor
    const navLinksObj = activePages.map(([pk, pd]) => ({ href: pd.href, label: pd.title, active: pk === 'index' }));
    const allContent = sections.filter(s => s.type !== 'footer').map(s => renderSectionHTML(s, false)).join('\n');
    let singlePageHTML = generateHTMLShell('Live Preview', siteName, css, navLinksObj, allContent, footerHTML, fonts);
    // Inject CSS & JS inline for the Code View text area so it's a single copy-paste file
    singlePageHTML = singlePageHTML.replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n    </style>`);
    singlePageHTML = singlePageHTML.replace('<script src="scripts.js"></script>', `<script>\n${js}\n    </script>`);
    return singlePageHTML;
  }

  // Generate Zip
  const zip = new JSZip();
  zip.file("styles.css", css);
  zip.file("scripts.js", js);
  
  Object.entries(generatedFiles).forEach(([filename, html]) => {
    zip.file(filename, html);
  });
  
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${siteName.toLowerCase().replace(/\s/g, '-')}.zip`);
}

function renderSectionHTML(section) {
  const { id, type, content } = section;
  
  switch (type) {
    case 'hero':
      return `
        <section id="${id}" class="hero">
            <div class="container">
                <h1>${content.heading || ''}</h1>
                <p>${content.subheading || ''}</p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="about.html" class="btn btn-primary">${content.cta || 'Get Started'}</a>
                    <a href="contact.html" class="btn btn-outline">${content.ctaSecondary || 'Learn More'}</a>
                </div>
            </div>
        </section>
      `;
    case 'features':
      return `
        <section id="${id}">
            <div class="container">
                <h2 style="text-align: center; margin-bottom: 3rem">${content.heading || ''}</h2>
                <div class="features-grid">
                    ${(content.items || []).map(item => `
                        <div class="feature-card">
                            <div style="font-size: 2.5rem; margin-bottom: 1rem">${item.icon || ''}</div>
                            <h3 style="margin-bottom: 1rem">${item.title || ''}</h3>
                            <p style="opacity: 0.7">${item.description || ''}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
      `;
    case 'about':
      return `
        <section id="${id}">
            <div class="container">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 4rem; align-items: center">
                    <div>
                        <h2>${content.heading || ''}</h2>
                        <p style="margin: 1.5rem 0; opacity: 0.8; font-size: 1.1rem">${content.text || ''}</p>
                        <a href="contact.html" class="btn btn-primary">Contact Us</a>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem">
                         ${(content.stats || []).map(s => `
                            <div style="background: var(--surface); padding: 2rem; border-radius: 1rem; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                                <div style="font-size: 2.5rem; font-weight: 900; color: var(--primary)">${s.number || ''}</div>
                                <div style="opacity: 0.5; margin-top: 0.5rem; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px;">${s.label || ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </section>
      `;
    case 'gallery':
      return `
        <section id="${id}">
            <div class="container">
                 <h2 style="text-align: center; margin-bottom: 1rem">${content.heading || ''}</h2>
                 <p style="text-align: center; opacity: 0.6; margin-bottom: 3rem">${content.subheading || ''}</p>
                 <div class="gallery-grid">
                    ${(content.images || []).map(img => `
                        <div class="gallery-item">
                            <img src="${img}" alt="Work sample" loading="lazy">
                        </div>
                    `).join('')}
                 </div>
            </div>
        </section>
      `;
    case 'testimonials':
      return `
        <section id="${id}">
            <div class="container">
                <h2 style="text-align: center; margin-bottom: 1rem">${content.heading || ''}</h2>
                <p style="text-align: center; opacity: 0.6; margin-bottom: 3rem">${content.subheading || ''}</p>
                <div class="features-grid">
                    ${(content.items || []).map(t => `
                        <div class="feature-card" style="text-align: left;">
                            <div style="font-size: 1.5rem; margin-bottom: 1rem; color: #fbbf24;">★★★★★</div>
                            <p style="opacity: 0.8; font-style: italic; margin-bottom: 1.5rem">"${t.text || ''}"</p>
                            <h4 style="margin-bottom: 0.2rem">${t.name || ''}</h4>
                            <div style="opacity: 0.5; font-size: 0.9rem">${t.role || ''}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
      `;
    case 'contact':
      return `
        <section id="${id}">
            <div class="container">
                 <h2 style="text-align: center; margin-bottom: 1rem">${content.heading || ''}</h2>
                 <p style="text-align: center; opacity: 0.6; margin-bottom: 3rem">${content.subheading || ''}</p>
                 <form>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <input type="text" placeholder="First Name" required>
                        <input type="text" placeholder="Last Name" required>
                    </div>
                    <input type="email" placeholder="Email Address" required>
                    <input type="text" placeholder="Subject" required>
                    <textarea placeholder="Your Message" rows="6" required></textarea>
                    <button type="submit" class="btn btn-primary" style="margin-top: 1rem; width: 100%;">Send Message</button>
                    <p style="text-align: center; opacity: 0.5; font-size: 0.8rem; margin-top: 1rem;">Alternatively, email us at <a href="mailto:${content.email || ''}" style="color: var(--primary)">${content.email || ''}</a></p>
                 </form>
            </div>
        </section>
      `;
    case 'footer':
      return `
        <footer style="padding: 4rem 0 2rem; background: var(--surface); border-top: 1px solid rgba(255,255,255,0.05); margin-top: auto;">
            <div class="container">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3rem; flex-wrap: wrap; gap: 2rem;">
                    <div>
                        <a href="index.html" style="font-weight: 900; font-size: 1.5rem; color: var(--primary); text-decoration: none; display: block; margin-bottom: 0.5rem">${content.brand || ''}</a>
                        <p style="opacity: 0.5; max-width: 300px;">${content.tagline || ''}</p>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 1rem;">Quick Links</h4>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem">
                            ${(content.links || []).map(l => `<a href="#" style="color: var(--text); text-decoration: none; opacity: 0.6; transition: opacity 0.3s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">${l}</a>`).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 1rem;">Connect</h4>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem">
                            <a href="#" style="color: var(--text); text-decoration: none; opacity: 0.6;">Twitter</a>
                            <a href="#" style="color: var(--text); text-decoration: none; opacity: 0.6;">LinkedIn</a>
                            <a href="#" style="color: var(--text); text-decoration: none; opacity: 0.6;">Instagram</a>
                        </div>
                    </div>
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem; display: flex; justify-content: space-between; align-items: center; opacity: 0.5; font-size: 0.875rem">
                    <p>${content.copyright || ''}</p>
                    <p>Designed with ❤️</p>
                </div>
            </div>
        </footer>
      `;
    default:
      return '';
  }
}

