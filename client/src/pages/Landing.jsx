import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Layers, Monitor, Download, Users, Star, ArrowRight, ChevronRight, Globe, Palette, Code2, BarChart3, Check, Play } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id: 'portfolio', emoji: '📸', name: 'Portfolio', desc: 'Showcase your creative work beautifully', color: '#a78bfa' },
  { id: 'business', emoji: '💼', name: 'Business', desc: 'Professional presence for your company', color: '#3b82f6' },
  { id: 'blog', emoji: '✍️', name: 'Blog', desc: 'Share your thoughts and stories', color: '#f59e0b' },
  { id: 'fitness', emoji: '💪', name: 'Fitness', desc: 'Inspire and motivate your clients', color: '#22c55e' },
  { id: 'restaurant', emoji: '🍽️', name: 'Restaurant', desc: 'Delight guests with your menu', color: '#f97316' },
  { id: 'ecommerce', emoji: '🛍️', name: 'E-Commerce', desc: 'Sell products with style', color: '#ec4899' },
];

const FEATURES = [
  { icon: <Sparkles size={22} />, title: 'AI Generation', desc: 'Type a prompt, get a full website in seconds' },
  { icon: <Layers size={22} />, title: 'Drag & Drop Editor', desc: 'Reorder, edit, and customize every section' },
  { icon: <Palette size={22} />, title: 'Smart Styling', desc: 'AI-chosen palettes, fonts, and layouts' },
  { icon: <Monitor size={22} />, title: 'Responsive Preview', desc: 'See your site on desktop, tablet, and mobile' },
  { icon: <Download size={22} />, title: 'Clean Code Export', desc: 'Download production-ready HTML/CSS/JS' },
  { icon: <Zap size={22} />, title: 'One-Click Deploy', desc: 'Go live instantly with a shareable preview link' },
  { icon: <Code2 size={22} />, title: 'AI Content Writer', desc: 'Generate headings, copy, and slogans instantly' },
  { icon: <BarChart3 size={22} />, title: 'Analytics Dashboard', desc: 'Track visits, clicks, and performance' },
];

const STEPS = [
  { n: '01', title: 'Describe Your Site', desc: 'Tell the AI what kind of website you need in plain English.' },
  { n: '02', title: 'AI Builds It', desc: 'The AI generates a complete website with content, sections, and design.' },
  { n: '03', title: 'Customize & Edit', desc: 'Drag, drop, and personalize every element to match your brand.' },
  { n: '04', title: 'Export & Launch', desc: 'Download your code or deploy with one click.' },
];

// ── Demo Player ──────────────────────────────────────────────────────────────
const CAPTIONS = [
  '1. Type any prompt on the landing page',
  '2. AI generates a full website in seconds',
  '3. Edit sections in the drag-and-drop editor',
  '4. Switch themes with one-click palette presets',
  '5. Chat with AI assistant for help',
  '6. Preview on mobile, tablet, or desktop',
  '7. Export clean HTML/CSS/JS with one click',
];

function DemoPlayer() {
  const [playing, setPlaying] = useState(true);
  const [step, setStep] = useState(0);
  const imgRef = React.useRef(null);

  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStep(s => (s + 1) % CAPTIONS.length), 3500);
    return () => clearInterval(t);
  }, [playing]);

  return (
    <div style={{ position: 'relative', borderRadius: '1.25rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)', background: '#0d0d1f' }}>
      {/* Browser chrome bar */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />)}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '0.375rem', padding: '0.25rem 0.875rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', maxWidth: 320, margin: '0 auto' }}>
          🔒 localhost:5173 — SiteForge AI
        </div>
      </div>

      {/* The actual recording */}
      <div style={{ position: 'relative', lineHeight: 0 }}>
        <img
          ref={imgRef}
          src="/demo-recording.webp"
          alt="SiteForge AI Demo"
          style={{ width: '100%', display: 'block', maxHeight: 520, objectFit: 'cover', objectPosition: 'top' }}
          onError={e => {
            // Fallback: show animated placeholder if webp not found
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        {/* Animated fallback when image not available */}
        <div style={{ display: 'none', background: 'linear-gradient(135deg,#0f0f2e,#1a0a2e)', height: 440, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2rem' }}>🎬</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Demo Preview</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>See it live at localhost:5173</div>
          </div>
          {/* Animated bars to simulate a "video" */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 50 }}>
            {Array.from({length: 12}).map((_, i) => (
              <div key={i} style={{
                width: 6, background: `hsl(${240 + i*8},70%,65%)`, borderRadius: 3,
                animation: `barPulse ${0.8 + i * 0.1}s ease-in-out infinite alternate`,
                height: `${20 + Math.sin(i * 1.2) * 18}px`,
              }} />
            ))}
          </div>
        </div>

        {/* Play/Pause overlay button */}
        <button
          onClick={() => setPlaying(p => !p)}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 64, height: 64, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', color: 'white', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        {/* Live caption badge */}
        <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)', borderRadius: '0.625rem', padding: '0.625rem 1rem', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 8, height: 8, background: playing ? '#22c55e' : '#f59e0b', borderRadius: '50%', flexShrink: 0, animation: playing ? 'blink 1.5s ease infinite' : 'none' }} />
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{CAPTIONS[step]}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{step + 1}/{CAPTIONS.length}</span>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', padding: '0.875rem', background: 'rgba(255,255,255,0.025)' }}>
        {CAPTIONS.map((_, i) => (
          <button key={i} onClick={() => setStep(i)} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? '#6366f1' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>

      <style>{`
        @keyframes barPulse { to { transform: scaleY(1.6); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}

export default function Landing() {

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!token) { navigate('/signup'); return; }
    setLoading(true);
    try {
      const aiRes = await api.post('/ai/generate', { prompt });
      const { sections, palette, fonts, siteName, category } = aiRes.data;
      const projRes = await api.post('/projects', {
        name: siteName || 'AI Generated Site',
        description: prompt,
        template: category,
        sections,
        palette,
        fonts,
        siteName,
      });
      navigate(`/editor/${projRes.data.id}`);
    } catch {
      toast.error('Failed to generate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplate = async (template) => {
    if (!token) { navigate('/signup'); return; }
    const prompts = {
      portfolio: 'create a stunning portfolio website for a photographer',
      business: 'build a professional business consulting website',
      blog: 'create a modern blog for tech articles and insights',
      fitness: 'build a fitness gym website with workout plans',
      restaurant: 'create a fine dining restaurant website with menu',
      ecommerce: 'build a fashion e-commerce store website',
    };
    setPrompt(prompts[template.id] || template.name);
    setLoading(true);
    try {
      const aiRes = await api.post('/ai/generate', { prompt: prompts[template.id] });
      const { sections, palette, fonts, siteName, category } = aiRes.data;
      const projRes = await api.post('/projects', {
        name: siteName || template.name,
        description: prompts[template.id],
        template: category,
        sections, palette, fonts, siteName,
      });
      navigate(`/editor/${projRes.data.id}`);
    } catch {
      toast.error('Template failed to load.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0efff', fontFamily: 'Inter,sans-serif', overflowX: 'hidden' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(8,8,16,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>SiteForge <span className="gradient-text">AI</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {token ? (
              <button className="btn-primary" onClick={() => navigate('/dashboard')}>Dashboard</button>
            ) : (
              <>
                <Link to="/login" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem' }}>Sign in</Link>
                <Link to="/signup" className="btn-primary" style={{ textDecoration: 'none' }}>Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '10rem', paddingBottom: '8rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '10%', width: 350, height: 350, background: 'radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '40%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(6,182,212,0.1),transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
          <div className="badge badge-primary" style={{ marginBottom: '1.5rem', display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
            <Sparkles size={12} /> AI-Powered Website Builder
          </div>

          <h1 style={{ fontSize: 'clamp(3rem,8vw,5.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Build Stunning Websites<br />
            <span className="gradient-text">With Just a Prompt</span>
          </h1>

          <p style={{ fontSize: '1.25rem', color: 'rgba(240,239,255,0.65)', maxWidth: 600, margin: '0 auto 3rem', lineHeight: 1.8 }}>
            Describe your website in plain English. Our AI builds a fully responsive, beautifully designed site — customizable down to every pixel.
          </p>

          {/* Prompt input */}
          <form onSubmit={handleGenerate} style={{ maxWidth: 700, margin: '0 auto 1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.875rem', padding: '0.5rem 0.5rem 0.5rem 1.25rem', backdropFilter: 'blur(10px)' }}>
              <input
                className="input-field"
                style={{ border: 'none', background: 'transparent', flex: 1, padding: '0.5rem 0', fontSize: '1rem' }}
                placeholder='e.g. "create a portfolio for a photographer in dark theme..."'
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', borderRadius: '0.625rem', flexShrink: 0 }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    Generating...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} /> Generate Site
                  </span>
                )}
              </button>
            </div>
          </form>

          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>
            No credit card required · Free forever plan · Export to HTML/CSS
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap' }}>
            {[['10,000+', 'Websites Built'], ['6', 'Template Categories'], ['100%', 'Responsive'], ['Free', 'Export to Code']].map(([n, l]) => (
              <div key={n} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{n}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>Templates</div>
          <h2 style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>Start from a Template</h2>
          <p style={{ color: 'rgba(240,239,255,0.55)', fontSize: '1.1rem' }}>Or let AI design from scratch with your custom prompt</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1.25rem' }}>
          {TEMPLATES.map(t => (
            <div
              key={t.id}
              className="card"
              style={{ padding: '1.75rem', cursor: 'pointer', border: `1px solid ${t.color}22` }}
              onClick={() => handleTemplate(t)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2.5rem' }}>{t.emoji}</span>
                <span style={{ background: `${t.color}22`, color: t.color, padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Template</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t.name}</h3>
              <p style={{ color: 'rgba(240,239,255,0.5)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{t.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: t.color, fontSize: '0.85rem', fontWeight: 600 }}>
                Use Template <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '6rem 2rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-label" style={{ marginBottom: '0.75rem' }}>Features</div>
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Everything You Need to Build</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.25rem' }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card" style={{ padding: '1.75rem' }}>
                <div style={{ width: 44, height: 44, background: 'rgba(99,102,241,0.15)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', marginBottom: '1rem' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'rgba(240,239,255,0.5)', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>How It Works</div>
          <h2 style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>From Idea to Live Site in Minutes</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.5rem' }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.25rem', fontWeight: 900, color: '#a78bfa' }}>
                {s.n}
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1.1rem' }}>{s.title}</h3>
              <p style={{ color: 'rgba(240,239,255,0.5)', lineHeight: 1.7, fontSize: '0.9rem' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Watch Demo ── */}
      <section style={{ padding: '6rem 2rem', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-label" style={{ marginBottom: '0.75rem' }}>Live Demo</div>
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              See SiteForge AI in Action
            </h2>
            <p style={{ color: 'rgba(240,239,255,0.55)', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto' }}>
              Watch how we build a complete photographer portfolio website from a single prompt in under 60 seconds.
            </p>
          </div>

          {/* Video container */}
          <DemoPlayer />

          {/* Step highlights below video */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem', marginTop: '3rem' }}>
            {[
              { emoji: '💬', title: 'Type a Prompt', desc: '"Create a photographer portfolio"', color: '#a78bfa' },
              { emoji: '⚡', title: 'AI Generates', desc: 'Full site in under 5 seconds', color: '#06b6d4' },
              { emoji: '🎨', title: 'Customize Freely', desc: 'Colors, fonts, layout — all editable', color: '#22c55e' },
              { emoji: '🚀', title: 'Export & Deploy', desc: 'Clean code zip or one-click deploy', color: '#f59e0b' },
            ].map(s => (
              <div key={s.title} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}20`, borderRadius: '0.875rem', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{s.emoji}</div>
                <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: s.color }}>{s.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section style={{ padding: '6rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center,rgba(99,102,241,0.12),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Ready to Build Your<br /><span className="gradient-text">Dream Website?</span>
          </h2>
          <p style={{ color: 'rgba(240,239,255,0.55)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
            Join thousands of creators who've launched stunning websites with SiteForge AI.
          </p>
          <Link to="/signup" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.875rem 2.5rem' }}>
            Start Building for Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
          <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} /> SiteForge AI
        </div>
        © 2025 SiteForge AI · Built with intelligence
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { h1 { font-size: 2.5rem !important; } }
      `}</style>
    </div>
  );
}
