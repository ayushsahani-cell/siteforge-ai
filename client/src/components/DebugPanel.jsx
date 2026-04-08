import React, { useState, useCallback, useRef } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, X, RefreshCw, Wand2,
  Download, ChevronDown, ChevronRight, AlertCircle,
  AlertTriangle, Info, Loader2, CheckCircle2, FileCode2,
  Bug, Zap, Clock
} from 'lucide-react';
import api from '../lib/api';
import useEditorStore from '../store/useEditorStore';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────
const SEVERITY_META = {
  error: {
    label: 'Error',
    icon: AlertCircle,
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    text: '#f87171',
    dot: '#ef4444',
  },
  warn: {
    label: 'Warning',
    icon: AlertTriangle,
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.25)',
    text: '#fbbf24',
    dot: '#f59e0b',
  },
  info: {
    label: 'Info',
    icon: Info,
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.25)',
    text: '#818cf8',
    dot: '#6366f1',
  },
};

const FILE_COLORS = {
  'index.html': '#fb923c',
  'styles.css': '#60a5fa',
  'scripts.js': '#4ade80',
};

function SeverityBadge({ severity }) {
  const meta = SEVERITY_META[severity] || SEVERITY_META.info;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.68rem',
      fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      background: meta.bg, border: `1px solid ${meta.border}`, color: meta.text,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
      {meta.label}
    </span>
  );
}

function FileBadge({ file }) {
  const color = FILE_COLORS[file] || '#94a3b8';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.15rem 0.55rem', borderRadius: '0.3rem', fontSize: '0.68rem',
      fontWeight: 600, background: `${color}18`, color, border: `1px solid ${color}30`,
      fontFamily: 'monospace',
    }}>
      <FileCode2 size={10} />
      {file}
    </span>
  );
}

function IssueRow({ issue, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const meta = SEVERITY_META[issue.severity] || SEVERITY_META.info;
  const Icon = meta.icon;

  return (
    <div style={{
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
      transition: 'background 0.15s',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', textAlign: 'left', background: 'transparent',
          border: 'none', cursor: 'pointer', padding: '0.75rem 1rem',
          color: 'white', display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Icon size={13} style={{ color: meta.text, marginTop: '0.15rem', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', lineHeight: 1.4, color: 'rgba(255,255,255,0.85)', marginBottom: '0.35rem' }}>
            {issue.message}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <SeverityBadge severity={issue.severity} />
            <FileBadge file={issue.file} />
            {issue.line && (
              <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                L{issue.line}
              </span>
            )}
            {issue.fix && (
              <span style={{
                fontSize: '0.66rem', color: '#a78bfa',
                background: 'rgba(167,139,250,0.1)', padding: '0.1rem 0.4rem',
                borderRadius: '0.25rem', border: '1px solid rgba(167,139,250,0.2)',
              }}>
                ✓ auto-fixable
              </span>
            )}
          </div>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>
      {expanded && (
        <div style={{
          padding: '0 1rem 0.75rem 2.6rem', fontSize: '0.78rem',
          color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace',
          lineHeight: 1.6,
        }}>
          Code: <span style={{ color: '#818cf8' }}>{issue.code}</span>
          {issue.fix && (
            <> &nbsp;|&nbsp; Fix strategy: <span style={{ color: '#4ade80' }}>{issue.fix.replace(/_/g, ' ')}</span></>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryBar({ summary, scanning }) {
  if (!summary) return null;
  return (
    <div style={{
      display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.75rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)',
    }}>
      {[
        { label: 'Errors', value: summary.errors, color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.2)' },
        { label: 'Warnings', value: summary.warnings, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
        { label: 'Info', value: summary.info, color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
        { label: 'Auto-fixable', value: summary.fixable, color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' },
      ].map(s => (
        <div key={s.label} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.3rem 0.7rem', borderRadius: '0.5rem',
          background: s.bg, border: `1px solid ${s.border}`,
          fontSize: '0.75rem', fontWeight: 700,
        }}>
          <span style={{ color: s.color, fontSize: '1rem' }}>{scanning ? '—' : s.value}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function FixLogItem({ item }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
      padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <CheckCircle2 size={13} style={{ color: '#4ade80', marginTop: '0.15rem', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.2rem' }}>
          {item.description}
        </div>
        <FileBadge file={item.file} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main DebugPanel Component
// ─────────────────────────────────────────────────────────────
export default function DebugPanel({ onClose, runtimeErrors = [] }) {
  const { files, updateFile } = useEditorStore();
  const [phase, setPhase] = useState('idle'); // idle | scanning | fixing | done
  const [report, setReport] = useState(null);           // { issues, summary }
  const [fixResult, setFixResult] = useState(null);     // { original, fixed, fixLog, files }
  const [activeTab, setActiveTab] = useState('issues'); // issues | fixes | runtime | log
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterFile, setFilterFile] = useState('all');
  const scanStartRef = useRef(null);

  // ── API helpers ──
  const runScan = useCallback(async () => {
    setPhase('scanning');
    setReport(null);
    setFixResult(null);
    scanStartRef.current = Date.now();
    try {
      const res = await api.post('/ai/debug', { files });
      setReport(res.data);
      setActiveTab('issues');
    } catch (err) {
      toast.error('Debug scan failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setPhase('done');
    }
  }, [files]);

  const runAutoFix = useCallback(async () => {
    setPhase('fixing');
    try {
      const res = await api.post('/ai/autofix', { files });
      const { files: patchedFiles, fixLog, fixed } = res.data;
      // Apply patched files to editor store
      Object.entries(patchedFiles).forEach(([filename, content]) => {
        updateFile(filename, content);
      });
      setFixResult(res.data);
      setReport({ issues: fixed.issues, summary: fixed.summary });
      setActiveTab('fixes');
      toast.success(`✅ Auto-fixed ${fixLog.length} issue(s)!`);
    } catch (err) {
      toast.error('Auto-fix failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setPhase('done');
    }
  }, [files, updateFile]);

  const exportLog = useCallback(() => {
    const data = { report, fixResult, runtimeErrors, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siteforge-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, fixResult, runtimeErrors]);

  // ── Filtered issues ──
  const allIssues = report?.issues || [];
  const filteredIssues = allIssues.filter(i => {
    if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false;
    if (filterFile !== 'all' && i.file !== filterFile) return false;
    return true;
  });

  const issueCount = allIssues.length + runtimeErrors.length;
  const isScanning = phase === 'scanning';
  const isFixing = phase === 'fixing';
  const isBusy = isScanning || isFixing;

  // ─────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'absolute', top: '60px', right: 0, bottom: 0,
      width: 460,
      background: 'linear-gradient(180deg, #0A0A16 0%, #080810 100%)',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column', zIndex: 50,
      boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(99,102,241,0.06)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '0.5rem',
          background: report?.summary.errors > 0
            ? 'rgba(239,68,68,0.2)'
            : report
              ? 'rgba(74,222,128,0.2)'
              : 'rgba(99,102,241,0.2)',
          border: `1px solid ${report?.summary.errors > 0 ? 'rgba(239,68,68,0.3)' : report ? 'rgba(74,222,128,0.3)' : 'rgba(99,102,241,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {report?.summary.errors > 0
            ? <ShieldAlert size={16} style={{ color: '#f87171' }} />
            : report
              ? <ShieldCheck size={16} style={{ color: '#4ade80' }} />
              : <Shield size={16} style={{ color: '#818cf8' }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Debug Console
            {issueCount > 0 && (
              <span style={{
                background: report?.summary.errors > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.15)',
                color: report?.summary.errors > 0 ? '#f87171' : '#fbbf24',
                border: `1px solid ${report?.summary.errors > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.25)'}`,
                fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.5rem',
                borderRadius: '999px',
              }}>
                {issueCount}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.1rem' }}>
            {phase === 'idle' && 'Run a scan to detect issues'}
            {phase === 'scanning' && 'Analyzing code...'}
            {phase === 'fixing' && 'Applying automatic fixes...'}
            {phase === 'done' && report && `${report.summary.total} issue(s) found · ${report.summary.fixable} auto-fixable`}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.25rem' }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Action Bar ── */}
      <div style={{
        display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
        background: 'rgba(0,0,0,0.15)',
      }}>
        <button
          onClick={runScan}
          disabled={isBusy}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.55rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8',
            cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => !isBusy && (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
        >
          {isScanning
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <RefreshCw size={13} />}
          {isScanning ? 'Scanning...' : phase === 'done' ? 'Re-scan' : 'Run Scan'}
        </button>

        <button
          onClick={runAutoFix}
          disabled={isBusy || !report || report.summary.fixable === 0}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.55rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
            background: isFixing ? 'rgba(167,139,250,0.15)' : 'rgba(74,222,128,0.12)',
            border: `1px solid ${isFixing ? 'rgba(167,139,250,0.3)' : 'rgba(74,222,128,0.25)'}`,
            color: isFixing ? '#c4b5fd' : '#4ade80',
            cursor: (isBusy || !report || report.summary.fixable === 0) ? 'not-allowed' : 'pointer',
            opacity: (!report || report.summary.fixable === 0) ? 0.4 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => !isBusy && report?.summary.fixable > 0 && (e.currentTarget.style.background = 'rgba(74,222,128,0.2)')}
          onMouseLeave={e => e.currentTarget.style.background = isFixing ? 'rgba(167,139,250,0.15)' : 'rgba(74,222,128,0.12)'}
        >
          {isFixing
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <Wand2 size={13} />}
          {isFixing ? 'Fixing...' : `Auto-Fix${report ? ` (${report.summary.fixable})` : ''}`}
        </button>

        {(report || runtimeErrors.length > 0) && (
          <button
            onClick={exportLog}
            title="Export debug log as JSON"
            style={{
              padding: '0.55rem 0.75rem', borderRadius: '0.5rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <Download size={13} />
          </button>
        )}
      </div>

      {/* ── Summary Bar ── */}
      {report && <SummaryBar summary={report.summary} scanning={isScanning} />}

      {/* ── Tabs ── */}
      {(report || fixResult || runtimeErrors.length > 0) && (
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0, background: 'rgba(0,0,0,0.1)',
        }}>
          {[
            { key: 'issues', label: 'Issues', count: allIssues.length, icon: Bug },
            { key: 'fixes', label: 'Applied Fixes', count: fixResult?.fixLog?.length || 0, icon: Zap, hidden: !fixResult },
            { key: 'runtime', label: 'Runtime', count: runtimeErrors.length, icon: AlertCircle, hidden: runtimeErrors.length === 0 },
          ].filter(t => !t.hidden).map(tab => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                flex: 1, padding: '0.65rem 0.5rem', border: 'none',
                background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
                color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                transition: 'all 0.15s',
              }}>
                <TabIcon size={12} />
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    background: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.08)',
                    color: active ? '#818cf8' : 'rgba(255,255,255,0.5)',
                    padding: '0.05rem 0.4rem', borderRadius: '999px', fontSize: '0.65rem',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Content Area ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Idle empty state */}
        {phase === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '1rem', marginBottom: '1.5rem',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={32} style={{ color: '#6366f1', opacity: 0.7 }} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
              Ready to Debug
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, maxWidth: 280 }}>
              Click <strong style={{ color: '#818cf8' }}>Run Scan</strong> to analyze your HTML, CSS, and JavaScript for bugs, accessibility issues, performance problems, and broken code.
            </p>
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', maxWidth: 300 }}>
              {[
                '🔍 HTML structure & SEO meta tags',
                '🎨 CSS compatibility & responsiveness',
                '⚡ JavaScript null refs & patterns',
                '🚀 Performance & loading issues',
              ].map(item => (
                <div key={item} style={{
                  padding: '0.55rem 0.875rem', borderRadius: '0.5rem',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', textAlign: 'left',
                }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scanning spinner */}
        {isScanning && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                border: '3px solid rgba(99,102,241,0.15)',
                borderTopColor: '#6366f1',
                animation: 'spin 1s linear infinite',
              }} />
              <Bug size={20} style={{ color: '#818cf8', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Analyzing code…</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>Checking HTML structure, CSS, and JavaScript</div>
            </div>
          </div>
        )}

        {/* Fixing spinner */}
        {isFixing && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                border: '3px solid rgba(74,222,128,0.15)',
                borderTopColor: '#4ade80',
                animation: 'spin 1s linear infinite',
              }} />
              <Wand2 size={20} style={{ color: '#4ade80', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Applying fixes…</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>Patching files and re-scanning</div>
            </div>
          </div>
        )}

        {/* Issues tab */}
        {!isBusy && report && activeTab === 'issues' && (
          <div>
            {/* Filters */}
            <div style={{
              display: 'flex', gap: '0.5rem', padding: '0.65rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(0,0,0,0.1)',
            }}>
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value)}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', padding: '0.35rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.75rem',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="all">All severities</option>
                <option value="error">Errors only</option>
                <option value="warn">Warnings only</option>
                <option value="info">Info only</option>
              </select>
              <select
                value={filterFile}
                onChange={e => setFilterFile(e.target.value)}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', padding: '0.35rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.75rem',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="all">All files</option>
                <option value="index.html">index.html</option>
                <option value="styles.css">styles.css</option>
                <option value="scripts.js">scripts.js</option>
              </select>
            </div>

            {filteredIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'rgba(255,255,255,0.3)' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 1rem', color: '#4ade80', opacity: 0.6 }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>
                  {allIssues.length === 0 ? 'No issues found!' : 'No issues match filters'}
                </div>
                <div style={{ fontSize: '0.78rem' }}>
                  {allIssues.length === 0 ? 'Your code is clean. 🎉' : 'Try changing the severity or file filter.'}
                </div>
              </div>
            ) : (
              <div>
                {filteredIssues.map((issue, idx) => (
                  <IssueRow key={`${issue.code}-${idx}`} issue={issue} isLast={idx === filteredIssues.length - 1} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applied Fixes tab */}
        {!isBusy && fixResult && activeTab === 'fixes' && (
          <div>
            {fixResult.fixLog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'rgba(255,255,255,0.3)' }}>
                <Info size={32} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                <div>No fixes were applied.</div>
              </div>
            ) : (
              <div style={{ padding: '0.5rem 1rem' }}>
                {/* Before/after counts */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
                  margin: '0.75rem 0 1rem',
                }}>
                  {[
                    { label: 'Before', count: fixResult.original.summary.total, color: '#f87171', sub: `${fixResult.original.summary.errors} errors` },
                    { label: 'After', count: fixResult.fixed.summary.total, color: '#4ade80', sub: `${fixResult.fixed.summary.errors} errors` },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding: '0.75rem', borderRadius: '0.625rem', textAlign: 'center',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color }}>{s.count}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem' }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  {fixResult.fixLog.length} Fix{fixResult.fixLog.length !== 1 ? 'es' : ''} Applied
                </div>
                {fixResult.fixLog.map((item, idx) => (
                  <FixLogItem key={idx} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Runtime Errors tab */}
        {activeTab === 'runtime' && (
          <div>
            {runtimeErrors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'rgba(255,255,255,0.3)' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 1rem', color: '#4ade80', opacity: 0.6 }} />
                <div>No runtime console errors detected.</div>
              </div>
            ) : (
              <div>
                {runtimeErrors.map((err, idx) => (
                  <div key={idx} style={{
                    padding: '0.75rem 1rem',
                    borderBottom: idx < runtimeErrors.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                  }}>
                    <AlertCircle size={13} style={{ color: '#f87171', marginTop: '0.15rem', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', color: '#fca5a5', fontFamily: 'monospace', lineHeight: 1.5 }}>{err.message}</div>
                      {err.source && (
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.3rem', fontFamily: 'monospace' }}>
                          {err.source}{err.line ? `:${err.line}` : ''}
                        </div>
                      )}
                      <div style={{ marginTop: '0.35rem' }}>
                        <SeverityBadge severity="error" />
                        <span style={{ marginLeft: '0.4rem', fontSize: '0.66rem', color: 'rgba(255,255,255,0.3)' }}>Runtime</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {report && (
        <div style={{
          padding: '0.6rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          flexShrink: 0,
        }}>
          <Clock size={11} style={{ color: 'rgba(255,255,255,0.25)' }} />
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)' }}>
            Last scan: {new Date(report.issues[0]?.timestamp || Date.now()).toLocaleTimeString()}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)' }}>
            SiteForge Debug Engine v1.0
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a1a2e; }
      `}</style>
    </div>
  );
}
