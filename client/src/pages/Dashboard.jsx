import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Trash2, Edit3, ExternalLink, BarChart3, Globe, Clock, Zap, Award, LogOut, Eye, Copy, Search, TrendingUp, MousePointerClick } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

const ANALYTIC_DATA = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  visits: Math.floor(Math.random() * 200 + 50),
  clicks: Math.floor(Math.random() * 100 + 20),
}));

const PROMPTS = [
  'Create a portfolio for a photographer',
  'Build a fitness gym website',
  'Design a restaurant landing page',
  'Make a tech startup website',
  'Create a fashion e-commerce store',
  'Build a personal blog',
];

const STATUS_COLORS = { draft: '#f59e0b', published: '#22c55e' };

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const WEEKLY_DATA = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  visits: Math.floor(Math.random() * 200 + 50),
  clicks: Math.floor(Math.random() * 100 + 20),
  bounce: Math.floor(Math.random() * 40 + 30),
}));

const SOURCES_DATA = [
  { name: 'Direct', value: 35, color: '#6366f1' },
  { name: 'Search', value: 28, color: '#06b6d4' },
  { name: 'Social', value: 22, color: '#ec4899' },
  { name: 'Referral', value: 15, color: '#f59e0b' },
];

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showPromptBox, setShowPromptBox] = useState(false);
  const [search, setSearch] = useState('');
  const [currentView, setCurrentView] = useState('projects'); // projects | analytics
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setCreating(true);
    try {
      const aiRes = await api.post('/ai/generate', { prompt });
      const { siteName, files } = aiRes.data;
      const projRes = await api.post('/projects', { name: siteName, description: prompt, template: 'custom', files, siteName });
      toast.success('Project created!');
      navigate(`/editor/${projRes.data.id}`);
    } catch {
      toast.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const deployProject = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/projects/${id}/deploy`);
      setProjects(p => p.map(x => x.id === id ? { ...x, status: 'published', deployUrl: res.data.deployUrl } : x));
      toast.success('Deployed! Preview link copied.');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(res.data.deployUrl).catch(() => {});
      }
    } catch {
      toast.error('Deploy failed');
    }
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalVisits = projects.reduce((a, p) => a + (p.analytics?.visits || 0), 0);
  const published = projects.filter(p => p.status === 'published').length;

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0efff', fontFamily: 'Inter,sans-serif' }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 220, background: 'rgba(10,10,22,0.97)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', padding: '1.25rem', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={14} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>SiteForge <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI</span></span>
        </div>

        {[
          { icon: <Globe size={16} />, label: 'Projects', view: 'projects' },
          { icon: <BarChart3 size={16} />, label: 'Analytics', view: 'analytics' },
          { icon: <Award size={16} />, label: 'Templates', view: 'templates' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => item.view === 'templates' ? navigate('/') : setCurrentView(item.view)}
            className="btn-ghost"
            style={{ justifyContent: 'flex-start', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', marginBottom: '0.25rem', background: currentView === item.view ? 'rgba(99,102,241,0.15)' : 'transparent', color: currentView === item.view ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}
          >
            {item.icon} {item.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* User info */}
        <div style={{ padding: '0.875rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.75rem' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#6366f1,#ec4899)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>{user?.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{user?.email}</div>
        </div>

        <button className="btn-ghost" onClick={() => { logout(); navigate('/'); }} style={{ justifyContent: 'flex-start', padding: '0.625rem 0.875rem', color: 'rgba(255,80,80,0.7)' }}>
          <LogOut size={15} /> Logout
        </button>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 220, padding: '2rem 2.5rem' }}>

        {/* ── Analytics View ── */}
        {currentView === 'analytics' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Analytics</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Simulated performance data across all your projects</p>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Total Visits', value: projects.reduce((a,p) => a+(p.analytics?.visits||0),0).toLocaleString(), icon: <Eye size={16}/>, color: '#6366f1', delta: '+12%' },
                { label: 'Total Clicks', value: projects.reduce((a,p) => a+(p.analytics?.clicks||0),0).toLocaleString(), icon: <MousePointerClick size={16}/>, color: '#06b6d4', delta: '+8%' },
                { label: 'Avg. Bounce', value: '38%', icon: <TrendingUp size={16}/>, color: '#f59e0b', delta: '-3%' },
                { label: 'Published Sites', value: projects.filter(p=>p.status==='published').length, icon: <Globe size={16}/>, color: '#22c55e', delta: '' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                    <span style={{ color: s.color, background: `${s.color}18`, padding: '0.3rem', borderRadius: '0.375rem' }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                  {s.delta && <div style={{ fontSize: '0.75rem', color: s.delta.startsWith('+') ? '#22c55e' : '#f59e0b', marginTop: '0.3rem' }}>{s.delta} this week</div>}
                </div>
              ))}
            </div>

            {/* Weekly visits chart */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={16} style={{ color: '#6366f1' }} /> Weekly Visits & Clicks
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={WEEKLY_DATA}>
                  <defs>
                    <linearGradient id="vg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }} />
                  <Area type="monotone" dataKey="visits" stroke="#6366f1" fill="url(#vg2)" strokeWidth={2} name="Visits" />
                  <Area type="monotone" dataKey="clicks" stroke="#06b6d4" fill="url(#cg2)" strokeWidth={2} name="Clicks" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom row: Bar + Pie */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Daily Bounce Rate</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={WEEKLY_DATA}>
                    <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }} />
                    <Bar dataKey="bounce" fill="#f59e0b" radius={[4,4,0,0]} name="Bounce %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Traffic Sources</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={SOURCES_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {SOURCES_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }} />
                    <Legend formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Per-project breakdown */}
            {projects.length > 0 && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Per-Project Performance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {projects.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem' }}>
                      <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${p.palette?.primary||'#6366f1'},${p.palette?.secondary||'#8b5cf6'})`, borderRadius: '0.5rem', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{p.template || 'custom'}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, color: '#6366f1' }}>{(p.analytics?.visits||0).toLocaleString()} visits</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{(p.analytics?.clicks||0)} clicks</div>
                      </div>
                      <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: '999px', flexShrink: 0 }}>
                        <div style={{ height: '100%', width: `${Math.min(100,(p.analytics?.visits||0)/5)}%`, background: p.palette?.primary||'#6366f1', borderRadius: '999px' }} />
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem' }}>No projects yet. Create one to see analytics.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Projects View ── */}
        {currentView === 'projects' && <>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>My Projects</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Build, customize, and launch your websites</p>
          </div>
          <button className="btn-primary" onClick={() => setShowPromptBox(p => !p)} style={{ gap: '0.5rem' }}>
            <Plus size={16} /> New Project
          </button>
        </div>

        {/* Prompt box */}
        {showPromptBox && (
          <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(99,102,241,0.25)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sparkles size={16} style={{ color: '#a78bfa' }} /> Generate with AI</h3>
            <form onSubmit={createProject} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                className="input-field"
                style={{ flex: 1, minWidth: 260 }}
                placeholder="Describe your website..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Generating...' : <><Zap size={15} /> Generate</>}
              </button>
            </form>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.875rem' }}>
              {PROMPTS.map(p => (
                <button key={p} onClick={() => setPrompt(p)} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Projects', value: projects.length, icon: <Globe size={16} />, color: '#6366f1' },
            { label: 'Published', value: published, icon: <Zap size={16} />, color: '#22c55e' },
            { label: 'Total Visits', value: totalVisits.toLocaleString(), icon: <BarChart3 size={16} />, color: '#06b6d4' },
            { label: 'AI Generations', value: projects.length, icon: <Sparkles size={16} />, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                <span style={{ color: s.color, background: `${s.color}18`, padding: '0.3rem', borderRadius: '0.375rem' }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Analytics chart */}
        {projects.length > 0 && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart3 size={16} style={{ color: '#6366f1' }} /> Weekly Analytics</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={ANALYTIC_DATA}>
                <defs>
                  <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }} />
                <Area type="monotone" dataKey="visits" stroke="#6366f1" fill="url(#visitsGrad)" strokeWidth={2} name="Visits" />
                <Area type="monotone" dataKey="clicks" stroke="#06b6d4" fill="url(#clicksGrad)" strokeWidth={2} name="Clicks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Projects grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ borderRadius: '1rem', height: 220 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'rgba(255,255,255,0.3)' }}>
            <Sparkles size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>No projects yet</h3>
            <p>Click "New Project" to generate your first AI website</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: '1.25rem' }}>
            {filtered.map(proj => (
              <div
                key={proj.id}
                className="card"
                style={{ cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => navigate(`/editor/${proj.id}`)}
              >
                {/* Thumbnail / color block */}
                <div style={{ height: 120, background: `linear-gradient(135deg, ${proj.palette?.primary || '#6366f1'}, ${proj.palette?.secondary || '#8b5cf6'})`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={36} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                    <span style={{ background: STATUS_COLORS[proj.status] || '#f59e0b', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {proj.status}
                    </span>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.4))' }} />
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '1.05rem' }}>{proj.name}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {proj.description || 'AI generated website'}
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Eye size={12} /> {proj.analytics?.visits || 0} visits</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> {timeAgo(proj.updatedAt)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center', padding: '0.5rem', fontSize: '0.8rem' }}
                      onClick={e => { e.stopPropagation(); navigate(`/editor/${proj.id}`); }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={e => deployProject(proj.id, e)}
                      title="Deploy"
                    >
                      <Zap size={13} />
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                      onClick={e => deleteProject(proj.id, e)}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {proj.deployUrl && (
                    <a href={proj.deployUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.625rem', color: '#22c55e', fontSize: '0.78rem', textDecoration: 'none' }}>
                      <ExternalLink size={11} /> {proj.deployUrl}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </> }
      </div>
    </div>
  );
}
