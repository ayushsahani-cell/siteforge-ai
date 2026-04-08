/**
 * Mock AI Engine for SiteForge
 * Intelligent Dynamic Website Construction Engine
 * Infers sections, content, and structures based on the user's natural language prompt.
 */
const geminiService = require('./geminiService');
const debugEngine = require('./debugEngine');

const PALETTES = [
  { primary: '#4f46e5', secondary: '#818cf8', bg: '#09090b', surface: '#18181b', text: '#fafafa', accent: '#2dd4bf', heroOverlay: 'rgba(9, 9, 11, 0.75)' },
  { primary: '#2563eb', secondary: '#60a5fa', bg: '#020617', surface: '#0f172a', text: '#f8fafc', accent: '#f43f5e', heroOverlay: 'rgba(2, 6, 23, 0.8)' },
  { primary: '#059669', secondary: '#34d399', bg: '#022c22', surface: '#064e3b', text: '#ecfdf5', accent: '#fbbf24', heroOverlay: 'rgba(2, 44, 34, 0.75)' },
  { primary: '#e11d48', secondary: '#fb7185', bg: '#2e020f', surface: '#4c0519', text: '#fff1f2', accent: '#c084fc', heroOverlay: 'rgba(46, 2, 15, 0.8)' },
  { primary: '#d97706', secondary: '#fbbf24', bg: '#1c1917', surface: '#292524', text: '#fafaf9', accent: '#ef4444', heroOverlay: 'rgba(28, 25, 23, 0.8)' },
];

const FONTS = [
  { heading: 'Inter', body: 'Inter' },
  { heading: 'Outfit', body: 'Roboto' },
  { heading: 'Playfair Display', body: 'Lato' },
  { heading: 'Montserrat', body: 'Open Sans' },
];

const IMAGES = {
  business: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600', // Corporate office
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800',  // Team meeting
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',  // Strategy
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800'   // Collaboration
  ],
  portfolio: [
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1600', // Abstract art
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800',  // Creative workspace
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',  // Minimal design
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800'   // Architecture
  ],
  fitness: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1600', // Gym dark
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800',  // Weights focus
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800',  // Trainer
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800'   // Yoga
  ],
  restaurant: [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1600', // Dark moody restaurant
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800',  // Fine dining plate
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=800',  // Chef cooking
    'https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&q=80&w=800'   // Cocktails
  ],
  ecommerce: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600', // Modern retail store
    'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&q=80&w=800',  // Product showcase
    'https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?auto=format&fit=crop&q=80&w=800',  // Minimal packaging
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'   // Watch product
  ],
  blog: [
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1600', // Desktop workspace
    'https://images.unsplash.com/photo-1455390582262-044cdead2708?auto=format&fit=crop&q=80&w=800',  // Writing
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=800',  // Coffee and laptop
    'https://images.unsplash.com/photo-1510915228340-29c8cdad7994?auto=format&fit=crop&q=80&w=800'   // Minimal tech
  ],
  generic: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1600', 
    'https://images.unsplash.com/photo-1557683304-673a23048d34?auto=format&fit=crop&q=80&w=800', 
    'https://images.unsplash.com/photo-1557683325-3ba8f0df79ae?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800'
  ]
};

function analyzePrompt(prompt) {
  const p = prompt.toLowerCase();
  
  // 1. Identify category mapping for images and tone
  let category = 'generic';
  if (p.includes('photo') || p.includes('artist') || p.includes('design') || p.includes('portfolio') || p.includes('art')) category = 'portfolio';
  else if (p.includes('gym') || p.includes('fit') || p.includes('workout') || p.includes('coach') || p.includes('health') || p.includes('yoga')) category = 'fitness';
  else if (p.includes('food') || p.includes('restaurant') || p.includes('eat') || p.includes('chef') || p.includes('cafe')) category = 'restaurant';
  else if (p.includes('shop') || p.includes('store') || p.includes('product') || p.includes('sell') || p.includes('e-commerce') || p.includes('buy')) category = 'ecommerce';
  else if (p.includes('tech') || p.includes('blog') || p.includes('write') || p.includes('article') || p.includes('news')) category = 'blog';
  else if (p.includes('business') || p.includes('corporate') || p.includes('agency') || p.includes('consulting') || p.includes('services')) category = 'business';

  // 2. Extract Site Name
  let siteName = 'Elevate';
  const nameMatch = prompt.match(/called (['"]?)(.*?)\1(?: |$)/i) || prompt.match(/named (['"]?)(.*?)\1(?: |$)/i);
  if (nameMatch && nameMatch[2]) {
    siteName = nameMatch[2].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  } else {
    const words = prompt.split(' ');
    if (words.length > 2) siteName = words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // 3. Intelligent Section Inference
  const sections = ['nav', 'hero', 'about', 'services'];
  if (category === 'portfolio' || p.includes('gallery') || p.includes('work') || p.includes('projects')) sections.push('gallery');
  if (p.includes('testimonial') || p.includes('review') || p.includes('feedback') || category === 'business' || category === 'fitness') sections.push('testimonials');
  if (p.includes('faq') || p.includes('questions')) sections.push('faq');
  sections.push('contact', 'footer');

  // 4. Content Generation Matrix
  const industryKeywords = p.split(' ').filter(w => w.length > 3).slice(0, 2).join(' ');
  
  let heroTitle = `Transforming ${siteName}`;
  let heroSub = `Delivering premium solutions built with modern technology and unparalleled design.`;
  
  if (category === 'portfolio') { heroTitle = `Creative Vision by ${siteName}`; heroSub = 'Capturing authentic moments and building stunning visual experiences that define your brand.'; }
  else if (category === 'fitness') { heroTitle = `Unleash Your Potential at ${siteName}`; heroSub = 'Expert coaching, premium facilities, and a community dedicated to your ultimate physical transformation.'; }
  else if (category === 'restaurant') { heroTitle = `Exquisite Dining at ${siteName}`; heroSub = 'Experience a culinary journey crafted with the finest local ingredients and passion for excellence.'; }
  else if (category === 'ecommerce') { heroTitle = `Modern Style by ${siteName}`; heroSub = 'Discover our curated collection of premium products designed for the modern individual.'; }

  return { category, siteName, sections, industryKeywords, heroTitle, heroSub };
}

function generateCSS(palette, fonts, heroImage) {
  return `
:root {
  --primary: ${palette.primary};
  --primary-glow: ${palette.secondary}80;
  --secondary: ${palette.secondary};
  --bg: ${palette.bg};
  --surface: ${palette.surface};
  --text: ${palette.text};
  --text-muted: rgba(255, 255, 255, 0.65);
  --accent: ${palette.accent};
  --hero-overlay: ${palette.heroOverlay};
  --font-heading: '${fonts.heading}', sans-serif;
  --font-body: '${fonts.body}', sans-serif;
}

/* Reset & Base */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { 
  background-color: var(--bg); 
  color: var(--text); 
  font-family: var(--font-body); 
  line-height: 1.6; 
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; display: block; }
a { text-decoration: none; color: inherit; }

/* Typography */
h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); line-height: 1.2; letter-spacing: -0.02em; }
h2 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin-bottom: 1.5rem; }
.section-subtitle { font-size: 1.125rem; color: var(--text-muted); max-width: 600px; margin: 0 auto 3.5rem; }
.text-center { text-align: center; }

/* Layout */
.container { width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 5%; }
section { padding: 7rem 0; position: relative; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 1px solid transparent;
}
.btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 14px 0 var(--primary-glow);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.23), 0 0 20px var(--primary-glow);
  background: var(--secondary);
}
.btn-outline {
  background: transparent;
  border-color: rgba(255,255,255,0.2);
  color: var(--text);
  backdrop-filter: blur(10px);
}
.btn-outline:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.4);
}

/* Animations */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-delay-1 { animation-delay: 0.1s; }
.animate-delay-2 { animation-delay: 0.2s; }
.animate-delay-3 { animation-delay: 0.3s; }

/* Navbar */
nav {
  position: fixed;
  top: 0;
  width: 100%;
  height: 80px;
  z-index: 1000;
  transition: all 0.3s ease;
  background: transparent;
}
nav.scrolled {
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
nav .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}
.logo { font-family: var(--font-heading); font-weight: 900; font-size: 1.5rem; letter-spacing: -0.03em; display: flex; align-items: center; gap: 0.5rem; }
.logo span { color: var(--primary); }
.nav-links { display: flex; gap: 2.5rem; align-items: center; }
.nav-links a { font-weight: 500; font-size: 0.95rem; color: var(--text-muted); transition: color 0.2s; }
.nav-links a:hover, .nav-links a.active { color: var(--text); }
.mobile-menu-btn { display: none; background: transparent; border: none; color: var(--text); cursor: pointer; }
@media (max-width: 768px) {
  .nav-links { display: none; width: 100%; flex-direction: column; position: absolute; top: 80px; left: 0; background: var(--surface); padding: 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .nav-links.active { display: flex; }
  .mobile-menu-btn { display: block; }
}

/* Hero Section */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  padding-top: 80px;
  background-image: url('${heroImage}');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, var(--hero-overlay) 0%, var(--bg) 100%);
  z-index: 1;
}
.hero .container {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 900px;
}
.hero h1 {
  font-size: clamp(3rem, 7vw, 5.5rem);
  font-weight: 900;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
.hero p {
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  color: var(--text-muted);
  margin-bottom: 3.5rem;
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
.hero .btn-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
@media (max-width: 600px) {
    .btn-group { flex-direction: column; width: 100%; }
    .btn-group .btn { width: 100%; }
}

/* About Section */
.about { background: var(--surface); }
.about-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
.about-image { border-radius: 1.5rem; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; }
.about-image::after { content: ''; position: absolute; inset: 0; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); border-radius: 1.5rem; }
.about-image img { width: 100%; height: auto; object-fit: cover; aspect-ratio: 4/3; }
.about-content h2 { margin-bottom: 1.5rem; }
.about-content p { font-size: 1.125rem; color: var(--text-muted); margin-bottom: 1.5rem; }
.about-stats { display: flex; gap: 3rem; margin-top: 3rem; padding-top: 3rem; border-top: 1px solid rgba(255,255,255,0.05); }
.stat-item h4 { font-size: 2.5rem; color: var(--primary); margin-bottom: 0.25rem; }
.stat-item p { font-size: 0.875rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
@media (max-width: 900px) { .about-wrapper { grid-template-columns: 1fr; } .about-stats { justify-content: center; } }

/* Features/Services Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}
.feature-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 1.5rem;
  padding: 3rem 2.5rem;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}
.feature-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}
.feature-card:hover { transform: translateY(-8px); background: rgba(255,255,255,0.05); box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
.feature-card:hover::before { opacity: 1; }
.feature-card .icon {
  width: 64px; height: 64px;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1rem;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; color: var(--primary);
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}
.feature-card h3 { font-size: 1.5rem; margin-bottom: 1rem; }
.feature-card p { color: var(--text-muted); line-height: 1.7; }

/* Image Gallery Grid */
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
.gallery-item { position: relative; border-radius: 1rem; overflow: hidden; aspect-ratio: 4/3; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
.gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.gallery-item:hover img { transform: scale(1.08); }
.gallery-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
  display: flex; align-items: flex-end; padding: 2rem;
  opacity: 0; transition: opacity 0.4s ease;
}
.gallery-item:hover .gallery-overlay { opacity: 1; }
.gallery-overlay h4 { font-size: 1.25rem; transform: translateY(20px); transition: transform 0.4s ease; }
.gallery-overlay p { color: var(--primary); font-size: 0.875rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem; transform: translateY(20px); transition: transform 0.4s ease; transition-delay: 0.05s;}
.gallery-item:hover .gallery-overlay h4, .gallery-item:hover .gallery-overlay p { transform: translateY(0); }

/* Testimonials */
.testimonials { background: var(--surface); }
.testimonial-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
.testimonial-card {
    background: var(--bg);
    padding: 2.5rem;
    border-radius: 1.5rem;
    border: 1px solid rgba(255,255,255,0.05);
}
.stars { color: var(--accent); margin-bottom: 1.5rem; letter-spacing: 2px; }
.testimonial-card p { font-size: 1.125rem; font-style: italic; color: var(--text-muted); margin-bottom: 2rem; }
.testimonial-author { display: flex; align-items: center; gap: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem; }
.testimonial-author .avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-heading); }
.testimonial-author h4 { font-size: 1rem; margin-bottom: 0.25rem; }
.testimonial-author span { color: var(--text-muted); font-size: 0.875rem; }

/* Contact Section */
.contact-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
@media (max-width: 900px) { .contact-wrapper { grid-template-columns: 1fr; } }
.contact-info h2 { font-size: 3rem; margin-bottom: 1rem; }
.contact-info p { color: var(--text-muted); font-size: 1.125rem; margin-bottom: 2rem; }
.contact-details { display: flex; flex-direction: column; gap: 1.5rem; }
.contact-detail-item { display: flex; align-items: center; gap: 1rem; }
.contact-detail-item .icon { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: var(--primary); }

form {
  background: var(--surface);
  padding: 3rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}
.form-group { margin-bottom: 1.5rem; position: relative; }
.form-group label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted); }
input, textarea { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 1rem 1.25rem; border-radius: 0.75rem; color: var(--text); font-family: inherit; font-size: 1rem; transition: all 0.3s ease; }
input:focus, textarea:focus { outline: none; border-color: var(--primary); background: rgba(255,255,255,0.05); box-shadow: 0 0 0 4px rgba(var(--primary), 0.1); }

/* Footer */
footer { background: #000; padding: 5rem 0 2rem; border-top: 1px solid rgba(255,255,255,0.05); }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 4rem; margin-bottom: 4rem; }
@media (max-width: 992px) { .footer-grid { grid-template-columns: 1fr 1fr; gap: 2rem; } }
@media (max-width: 576px) { .footer-grid { grid-template-columns: 1fr; } }
.footer-brand p { color: var(--text-muted); margin-top: 1rem; max-width: 300px; }
.footer-heading { font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem; }
.footer-links { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
.footer-links a { color: var(--text-muted); transition: color 0.2s; }
.footer-links a:hover { color: var(--primary); }
.footer-bottom { text-align: center; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.875rem; }
`;
}

function buildHTML(analysis, images, fonts) {
  const { siteName, sections, industryKeywords, heroTitle, heroSub } = analysis;
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${siteName} - Premium ${industryKeywords} services. Designed with modern web standards for optimal performance and accessibility.">
    <title>${siteName} | Premium Experience</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <!-- Dynamic Google Fonts based on selection -->
    <link rel="stylesheet" href="styles.css">
</head>
<body>`;

  // Iteratively build the DOM tree based on dynamically inferred sections
  sections.forEach(section => {
    switch (section) {
      case 'nav':
        html += `
    <nav id="navbar">
        <div class="container">
            <a href="#" class="logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                ${siteName}<span>.</span>
            </a>
            <button class="mobile-menu-btn" aria-label="Toggle menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <div class="nav-links">
                ${sections.filter(s => s !== 'nav' && s !== 'hero' && s !== 'footer').map(s => `<a href="#${s}" style="text-transform: capitalize;">${s}</a>`).join('')}
                <a href="#contact" class="btn btn-primary" style="padding: 0.6rem 1.5rem; color: white;">Get Started</a>
            </div>
        </div>
    </nav>`;
        break;

      case 'hero':
        html += `
    <main>
        <section id="hero" class="hero">
            <div class="container">
                <h1>${heroTitle}</h1>
                <p class="animate-delay-1">${heroSub}</p>
                <div class="btn-group animate-delay-2">
                    <a href="#${sections[2] || 'about'}" class="btn btn-primary">Discover More</a>
                    <a href="#contact" class="btn btn-outline">Contact Us</a>
                </div>
            </div>
        </section>`;
        break;

      case 'about':
        html += `
        <section id="about" class="about">
            <div class="container about-wrapper">
                <div class="about-image">
                    <img src="${images[1] || images[0]}" alt="About ${siteName}" loading="lazy" />
                </div>
                <div class="about-content">
                    <h2>Our Philosophy</h2>
                    <p>At ${siteName}, we believe in pushing the boundaries of what's possible within the ${industryKeywords || 'digital'} landscape. Our approach blends deep industry expertise with cutting-edge methodologies to deliver outcomes that not only meet, but redefine expectations.</p>
                    <p>We partner with forward-thinking organizations to build resilient, scalable solutions. Every detail is crafted with precision, putting user experience and long-term sustainability at the forefront of our engineering process.</p>
                    
                    <div class="about-stats">
                        <div class="stat-item">
                            <h4>98%</h4>
                            <p>Client Success</p>
                        </div>
                        <div class="stat-item">
                            <h4>2.5x</h4>
                            <p>Growth Rate</p>
                        </div>
                        <div class="stat-item">
                            <h4>24/7</h4>
                            <p>Global Support</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>`;
        break;

      case 'services':
        let f1 = { t: 'Market Strategy', d: 'Comprehensive analysis and execution plans tailored to penetrate target demographics and maximize long-term ROI.' };
        let f2 = { t: 'Agile Execution', d: 'Iterative frameworks ensuring that your project reaches its goals swiftly without ever compromising on stability.' };
        let f3 = { t: 'Digital Transformation', d: 'Modernizing legacy systems into highly robust, intelligent infrastructures providing seamless horizontal scalability.' };
        
        if (analysis.category === 'restaurant') {
            f1 = { t: 'Fine Dining', d: 'Experience an unparalleled culinary journey with dishes crafted to perfection by our world-renowned chefs.' };
            f2 = { t: 'Private Events', d: 'Host your special occasions in an elegant atmosphere with dedicated service and fully customized immersive menus.' };
            f3 = { t: 'Premium Catering', d: 'Bring the exceptional quality of our kitchen directly to your venue with our bespoke luxury catering options.' };
        } else if (analysis.category === 'portfolio' || analysis.category === 'blog') {
            f1 = { t: 'Creative Direction', d: 'Establishing a cohesive and powerful visual language that perfectly encapsulates your brand identity.' };
            f2 = { t: 'UI/UX Design', d: 'Crafting intuitive digital experiences that engage users and drive meaningful interaction.' };
            f3 = { t: 'Content Strategy', d: 'Developing compelling narratives that connect deeply with your audience and elevate your message.' };
        } else if (analysis.category === 'fitness') {
            f1 = { t: 'Personal Training', d: 'One-on-one tailored coaching to help you crush your specific physical goals with maximum efficiency.' };
            f2 = { t: 'Nutrition Planning', d: 'Data-driven meal strategies designed to optimize your energy levels and accelerate your physical transformation.' };
            f3 = { t: 'Group Classes', d: 'High-energy community sessions led by elite instructors to push your limits in a supportive environment.' };
        }
        
        html += `
        <section id="services">
            <div class="container">
                <div class="text-center">
                    <h2>Core Capabilities</h2>
                    <p class="section-subtitle">Discover how our state-of-the-art methodologies and dedicated teams create unmatched value in ${industryKeywords || 'various industries'}.</p>
                </div>
                
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        </div>
                        <h3>${f1.t}</h3>
                        <p>${f1.d}</p>
                    </div>
                    <div class="feature-card">
                        <div class="icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 14 4-4m-4 4-4-4m4 4V3m0 18a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z"/></svg>
                        </div>
                        <h3>${f2.t}</h3>
                        <p>${f2.d}</p>
                    </div>
                    <div class="feature-card">
                        <div class="icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        </div>
                        <h3>${f3.t}</h3>
                        <p>${f3.d}</p>
                    </div>
                </div>
            </div>
        </section>`;
        break;

      case 'gallery':
        html += `
        <section id="gallery" style="background: var(--surface);">
            <div class="container">
                <div class="text-center">
                    <h2>Featured Showcase</h2>
                    <p class="section-subtitle">A glimpse into our recent successful engagements and creative executions.</p>
                </div>
                
                <div class="gallery-grid">
                    ${images.slice(0, 3).map((img, i) => `
                    <div class="gallery-item">
                        <img src="${img}" alt="Showcase ${i+1}" loading="lazy" />
                        <div class="gallery-overlay">
                            <div>
                                <p>Case Study 0${i+1}</p>
                                <h4>Premium Execution</h4>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
        </section>`;
        break;

      case 'testimonials':
        html += `
        <section id="testimonials" class="testimonials">
            <div class="container">
                <div class="text-center">
                    <h2>Client Success</h2>
                    <p class="section-subtitle">Read what industry leaders think about our transformative solutions.</p>
                </div>
                
                <div class="testimonial-grid">
                    <div class="testimonial-card">
                        <div class="stars">★★★★★</div>
                        <p>"${siteName} completely revolutionized our operational pipeline. Their attention to detail and proactive support made all the difference."</p>
                        <div class="testimonial-author">
                            <div class="avatar">S</div>
                            <div>
                                <h4>Sarah Jenkins</h4>
                                <span>Operations Director</span>
                            </div>
                        </div>
                    </div>
                    <div class="testimonial-card">
                        <div class="stars">★★★★★</div>
                        <p>"The level of professionalism and technical acumen delivered by the team is unparalleled. An absolutely vital partner."</p>
                        <div class="testimonial-author">
                            <div class="avatar">M</div>
                            <div>
                                <h4>Marcus Reed</h4>
                                <span>Chief Technology Officer</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>`;
        break;

      case 'faq':
        html += `
        <section id="faq" style="background: var(--surface);">
            <div class="container" style="max-width: 800px;">
                <div class="text-center">
                    <h2>Frequent Questions</h2>
                    <p class="section-subtitle">Everything you need to know about working with ${siteName}.</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div style="background: var(--bg); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.05);">
                        <h4 style="margin-bottom: 0.5rem; font-size: 1.1rem;">What is your typical timeline?</h4>
                        <p style="color: var(--text-muted);">Depending on the scope, initial deliverables are usually provided within 2-4 weeks, ensuring agile iterations.</p>
                    </div>
                    <div style="background: var(--bg); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.05);">
                        <h4 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Do you offer ongoing support?</h4>
                        <p style="color: var(--text-muted);">Absolutely. We construct dedicated SLAs and retention agreements tailored precisely to your operational needs.</p>
                    </div>
                </div>
            </div>
        </section>`;
        break;

      case 'contact':
        html += `
        <section id="contact" class="contact-section">
            <div class="container contact-wrapper">
                <div class="contact-info">
                    <h2>Let's build something extraordinary.</h2>
                    <p>Have a project in mind? Our team is ready to deliver premium results. Reach out today and let's start a conversation.</p>
                    
                    <div class="contact-details">
                        <div class="contact-detail-item">
                            <div class="icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </div>
                            <div>
                                <div style="font-size: 0.875rem; color: var(--text-muted);">Call Us</div>
                                <div style="font-weight: 600;">+1 (555) 123-4567</div>
                            </div>
                        </div>
                        <div class="contact-detail-item">
                            <div class="icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            </div>
                            <div>
                                <div style="font-size: 0.875rem; color: var(--text-muted);">Email Us</div>
                                <div style="font-weight: 600;">hello@${siteName.toLowerCase().replace(/\s/g, '')}.com</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <form id="contact-form">
                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Send a message</h3>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">We typically reply within 24 hours.</p>
                    </div>
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" placeholder="John Doe" required>
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" placeholder="john@example.com" required>
                    </div>
                    <div class="form-group">
                        <label>Message</label>
                        <textarea placeholder="Tell us about your project..." rows="4" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Send Message</button>
                </form>
            </div>
        </section>
    </main>`;
        break;

      case 'footer':
        html += `
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <a href="#" class="logo">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        ${siteName}<span>.</span>
                    </a>
                    <p>Elevating digital experiences through innovative design and cutting-edge engineering.</p>
                </div>
                <div>
                    <h4 class="footer-heading">Navigate</h4>
                    <ul class="footer-links">
                        ${sections.filter(s => s !== 'nav' && s !== 'hero' && s !== 'footer').map(s => `<li><a href="#${s}" style="text-transform: capitalize;">${s}</a></li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h4 class="footer-heading">Connect</h4>
                    <ul class="footer-links">
                        <li><a href="#">Twitter</a></li>
                        <li><a href="#">LinkedIn</a></li>
                        <li><a href="#">Instagram</a></li>
                        <li><a href="#">GitHub</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="footer-heading">Legal</h4>
                    <ul class="footer-links">
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Terms of Service</a></li>
                        <li><a href="#">Cookie Policy</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                &copy; ${new Date().getFullYear()} ${siteName}. All rights reserved. Crafted with precision.
            </div>
        </div>
    </footer>`;
        break;
    }
  });

  html += `
    <script src="scripts.js"></script>
</body>
</html>`;

  // Inject the dynamically generated font string into HTML replacing placeholder
  html = html.replace('<!-- Dynamic Google Fonts based on selection -->', `<link href="https://fonts.googleapis.com/css2?family=${fonts.heading.replace(/\s/g, '+')}:wght@700;800;900&family=${fonts.body.replace(/\s/g, '+')}:wght@400;500;600&display=swap" rel="stylesheet">`);

  return html;
}

function generateJS() {
  return `/**
 * SiteForge AI Engine - Premium Output JS
 */

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (navbar && window.scrollY > 50) navbar.classList.add('scrolled');
    else if (navbar) navbar.classList.remove('scrolled');
});

// Mobile Menu Toggle
const menuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('active'));
    });
}

// Smooth reveal on scroll for sections
const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Apply initial state to dynamic sections
document.querySelectorAll('section').forEach(section => {
    if(section.id !== 'hero') {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        observer.observe(section);
    }
});

// Functional Form Handling
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button') || e.target.querySelector('input[type="submit"]');
        if (!btn) return;
        
        const isInput = btn.tagName.toLowerCase() === 'input';
        const ogText = isInput ? btn.value : btn.innerText;
        
        if (isInput) btn.value = 'Sending...';
        else btn.innerText = 'Sending...';
        
        btn.style.opacity = '0.8';
        btn.style.pointerEvents = 'none';
        
        setTimeout(() => {
            const successMsg = 'Message Sent Successfully!';
            if (isInput) btn.value = successMsg;
            else btn.innerText = successMsg;
            
            btn.style.background = 'var(--accent)';
            btn.style.color = '#000';
            btn.style.boxShadow = '0 0 20px var(--accent)';
            e.target.reset();
            
            setTimeout(() => {
                if (isInput) btn.value = ogText;
                else btn.innerText = ogText;
                
                btn.style.background = '';
                btn.style.color = '';
                btn.style.boxShadow = '';
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }, 3000);
        }, 1500);
    });
}
`;
}

function generateWebsite(prompt) {
  const analysis = analyzePrompt(prompt);
  const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const fonts = FONTS[Math.floor(Math.random() * FONTS.length)];
  const images = IMAGES[analysis.category] || IMAGES['generic'];

  const heroImage = images[0];

  const html = buildHTML(analysis, images, fonts);
  const css = generateCSS(palette, fonts, heroImage);
  const js = generateJS();

  const unoptimizedFiles = { 'index.html': html, 'styles.css': css, 'scripts.js': js };
  
  // Continuous Design Validation: automatically fix spacing, layout, typography, and code bugs
  const { files: optimizedFiles } = debugEngine.analyzeAndFix(unoptimizedFiles);

  return { siteName: analysis.siteName, files: optimizedFiles };
}

function regenerateSection(sectionType, prompt, palette) {
  return { error: 'Not implemented dynamically yet. Use the chat instead.' };
}

function generateContent(type, topic, tone) {
  return { content: 'Generated content placeholder.' };
}

// Advanced Design Knowledge Base
const DESIGN_SYSTEMS = {
  tech: {
    palette: { primary: '#6366f1', secondary: '#818cf8', bg: '#05050a', surface: '#0f0f18', text: '#f8fafc' },
    font: { heading: 'Outfit', body: 'Inter' },
    style: 'glass',
    tips: [
      { tip: "Repair Interactivity", cmd: "fix buttons and menu" },
      { tip: "Use Modern Glassmorphism", cmd: "add glassmorphism to cards" }
    ]
  },
  fitness: {
    palette: { primary: '#f43f5e', secondary: '#fb7185', bg: '#0f172a', surface: '#1e293b', text: '#f1f5f9' },
    font: { heading: 'Montserrat', body: 'Open Sans' },
    style: 'vibrant',
    tips: [
      { tip: "Repair Interactivity", cmd: "fix buttons and menu" },
      { tip: "Add High-Contrast UI", cmd: "improve accessibility and contrast" }
    ]
  },
  portfolio: {
    palette: { primary: '#111827', secondary: '#374151', bg: '#ffffff', surface: '#f9fafb', text: '#111827' },
    font: { heading: 'Playfair Display', body: 'Lato' },
    style: 'minimal',
    tips: [
      { tip: "Repair Interactivity", cmd: "fix buttons and menu" },
      { tip: "Use Minimalist Aesthetic", cmd: "make it minimal and clean" }
    ]
  },
  business: {
    palette: { primary: '#0ea5e9', secondary: '#38bdf8', bg: '#ffffff', surface: '#f8fafc', text: '#0f172a' },
    font: { heading: 'Inter', body: 'Inter' },
    style: 'corporate',
    tips: [
      { tip: "Repair Interactivity", cmd: "fix buttons and menu" },
      { tip: "Add Micro-Animations", cmd: "add hover animations" }
    ]
  }
};

async function chat(message, currentProject = {}) {
  // 1. Use real Gemini AI if API key is provided
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_API_KEY_HERE') {
    try {
      console.log('[AI Engine] Routing request through Google Gemini...');
      return await geminiService.generateCodeEdit(message, currentProject);
    } catch (err) {
      console.error('[AI Engine] Gemini API failed! Falling back to offline mock engine:', err);
    }
  }

  // 2. Fallback to existing mock logic
  const msg = message.toLowerCase();
  const category = currentProject.category || 'generic';
  let css = currentProject.files?.['styles.css'] || '';
  let html = currentProject.files?.['index.html'] || '';
  let updatedCss = css;
  let updatedHtml = html;
  
  // 1. Repair / Interaction Fixes (Priority)
  if (msg.includes('button') || msg.includes('not working') || msg.includes('menu') || msg.includes('fix')) {
    const fullJs = generateJS();
    return {
      message: "I've detected missing or broken interactivity logic in your project. I have now **fully repaired** your `scripts.js` file to enable smooth scrolling, mobile menu toggling, and contact form feedback!",
      action: 'updateFile',
      payload: { filename: 'scripts.js', content: fullJs }
    };
  }

  // Helpers
  const replaceCssVar = (cssStr, varName, newValue) => {
    const regex = new RegExp(`(--${varName}:\\s*)([^;]+)(;)`, 'g');
    if (regex.test(cssStr)) return cssStr.replace(regex, `$1${newValue}$3`);
    return cssStr.replace(/:root\s*\{/, `:root {\n  --${varName}: ${newValue};`);
  };

  // Logic to identify desired design system
  let system = DESIGN_SYSTEMS[category] || DESIGN_SYSTEMS.business;

  // 1. Contextual Recommendations
  if (msg.includes('suggest') || msg.includes('what should i do') || msg.includes('tips')) {
    const suggestions = [
       ...system.tips,
       { tip: "Improve UI Responsiveness", cmd: "improve ui ux" },
       { tip: "Update All Images", cmd: "add better images" }
    ];
    return { 
      message: `As your **Smart Design Assistant**, I recommend the following for your **${category}** website to match modern **${system.style}** trends:`, 
      action: 'suggestions', 
      payload: suggestions 
    };
  }

  // 2. Complex Theme Switching (Logic-based)
  if (msg.includes('dark') || msg.includes('night mode')) {
    const theme = DESIGN_SYSTEMS.tech.palette;
    updatedCss = replaceCssVar(updatedCss, 'bg', theme.bg);
    updatedCss = replaceCssVar(updatedCss, 'surface', theme.surface);
    updatedCss = replaceCssVar(updatedCss, 'text', theme.text);
    updatedCss = replaceCssVar(updatedCss, 'hero-overlay', 'rgba(0,0,0,0.85)');
    updatedCss = updatedCss.replace(/linear-gradient\(135deg, #09090b 0%, rgba\(9, 9, 11, 0\.7\) 100%\)/g, 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)'); // invert gradient check
    return { message: "Applying a **premium dark theme** with high-contrast surfaces.", action: 'updateFile', payload: { filename: 'styles.css', content: updatedCss } };
  }

  if (msg.includes('light') || msg.includes('clean light')) {
    updatedCss = replaceCssVar(updatedCss, 'bg', '#f8fafc');
    updatedCss = replaceCssVar(updatedCss, 'surface', '#ffffff');
    updatedCss = replaceCssVar(updatedCss, 'text', '#0f172a');
    updatedCss = replaceCssVar(updatedCss, 'text-muted', 'rgba(15, 23, 42, 0.65)');
    updatedCss = replaceCssVar(updatedCss, 'hero-overlay', 'rgba(255,255,255,0.7)');
    updatedCss = updatedCss.replace(/linear-gradient\(135deg, #fff 0%, rgba\(255,255,255,0\.7\) 100%\)/g, 'linear-gradient(135deg, #0f172a 0%, rgba(15, 23, 42, 0.7) 100%)');
    return { message: "Switched to a **refined light theme** for maximum readability.", action: 'updateFile', payload: { filename: 'styles.css', content: updatedCss } };
  }

  // 3. Modern Design Trends
  if (msg.includes('glass') || msg.includes('glassmorphism')) {
    const glassStyle = `
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
`;
    updatedCss = updatedCss.replace(/\.feature-card\s*\{[^}]+\}/g, `.feature-card { ${glassStyle} border-radius: 1.5rem; padding: 3rem 2.5rem; transition: all 0.4s ease; position: relative; overflow: hidden; }`);
    updatedCss = updatedCss.replace(/\.testimonial-card\s*\{[^}]+\}/g, `.testimonial-card { ${glassStyle} padding: 2.5rem; border-radius: 1.5rem; }`);
    return { message: "Injected **Glassmorphism** depth effects into your components.", action: 'updateFile', payload: { filename: 'styles.css', content: updatedCss } };
  }

  if (msg.includes('neon') || msg.includes('cyberpunk')) {
    updatedCss = replaceCssVar(updatedCss, 'primary', '#00f2ff');
    updatedCss = replaceCssVar(updatedCss, 'secondary', '#ff00d4');
    updatedCss = replaceCssVar(updatedCss, 'bg', '#020205');
    updatedCss = updatedCss.replace(/\.btn-primary\s*\{[^}]+\}/g, `.btn-primary { background: transparent; border: 2px solid var(--primary); color: var(--primary); box-shadow: 0 0 15px var(--primary); text-transform: uppercase; letter-spacing: 2px; }`);
    return { message: "Activating **Cyberpunk Neon** mode. Brace yourself.", action: 'updateFile', payload: { filename: 'styles.css', content: updatedCss } };
  }

  // 4. Content & Images
  if (msg.includes('images') || msg.includes('photos')) {
    const searchTerms = msg.split(' ').filter(word => word.length > 4);
    let chosenCategory = category;
    if (msg.includes('tech')) chosenCategory = 'blog';
    else if (msg.includes('gym')) chosenCategory = 'fitness';
    
    const newImgs = IMAGES[chosenCategory] || IMAGES.generic;
    let idx = 0;
    updatedHtml = updatedHtml.replace(/src="https:\/\/images\.unsplash\.com\/photo-[^"]+"/g, (match) => {
      const img = newImgs[idx % newImgs.length];
      idx++;
      return `src="${img}"`;
    });
    updatedCss = updatedCss.replace(/url\('https:\/\/images\.unsplash\.com\/photo-[^']+'\)/, `url('${newImgs[0]}')`);
    
    return { 
      message: `I've intelligently updated your visual assets with **high-quality ${chosenCategory} imagery** curated for your brand.`, 
      action: 'updateMultipleFiles', 
      payload: { 'index.html': updatedHtml, 'styles.css': updatedCss } 
    };
  }

  // 5. Layout & Spacing
  if (msg.includes('spacing') || msg.includes('spacious') || msg.includes('breathe')) {
    updatedCss = updatedCss.replace(/padding: [0-9.]+rem 0;/g, 'padding: 12rem 0;');
    updatedCss = updatedCss.replace(/gap: [0-9.]+rem;/g, 'gap: 4rem;');
    return { message: "Enhanced the **visual hierarchy** by adding generous white space between sections.", action: 'updateFile', payload: { filename: 'styles.css', content: updatedCss } };
  }

  // 6. Typography & UI
  if (msg.includes('font') || msg.includes('typography') || msg.includes('modern')) {
    const font = DESIGN_SYSTEMS.tech.font;
    updatedCss = replaceCssVar(updatedCss, 'font-heading', `'${font.heading}', sans-serif`);
    updatedCss = replaceCssVar(updatedCss, 'font-body', `'${font.body}', sans-serif`);
    updatedHtml = updatedHtml.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=[^"]+" rel="stylesheet">/, 
      `<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`);
    return { message: "Switched to a **modern typographic system** (Outfit + Inter) for better legibility.", action: 'updateMultipleFiles', payload: { 'index.html': updatedHtml, 'styles.css': updatedCss } };
  }

  if (msg.includes('ui') || msg.includes('ux') || msg.includes('professional')) {
    updatedCss = updatedCss.replace(/border-radius: [0-9.]+rem;/g, 'border-radius: 1.5rem;');
    updatedCss += "\n.btn { transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }\n.btn:active { transform: scale(0.95); }\n";
    return { message: "Refined the **User Interface** with consistent radiuses and tactile feedback animations.", action: 'updateFile', payload: { filename: 'styles.css', content: updatedCss } };
  }

  // Fallback
  return { 
    message: "I'm ready to help you polish this design. You can ask me to **'make it dark'**, **'add glassmorphism'**, **'suggest improvements'**, or **'modernize the typography'**.",
    action: 'suggestions',
    payload: system.tips
  };
}

module.exports = { generateWebsite, chat, regenerateSection, generateContent };
