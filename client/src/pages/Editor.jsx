import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Monitor, Tablet, Smartphone, Undo2, Redo2, Download, Save,
  Sparkles, Send, X, ChevronLeft, Globe, Play, Code, Bug, Plus, Minus, RefreshCcw
} from 'lucide-react';
import api from '../lib/api';
import useEditorStore from '../store/useEditorStore';
import toast from 'react-hot-toast';
import { exportWebsite } from '../lib/exportEngine';
import DebugPanel from '../components/DebugPanel';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reqSent = useRef(false);
  
  const {
    files, activeFile, siteName, viewport, isSaving, isDirty,
    initProject, updateFile, setActiveFile, setViewport, setSaving, markSaved, undo, redo, history, future
  } = useEditorStore();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [runtimeErrors, setRuntimeErrors] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [messages, setMessages] = useState([{ role: 'system', text: "I'm your AI coding assistant. Ask me to make changes to your code!" }]);

  // Capture console errors from the live preview iframe via postMessage
  const handleIframeMessage = useCallback((event) => {
    if (event.data && event.data.type === 'sf-console-error') {
      setRuntimeErrors(prev => [
        ...prev.slice(-49), // keep max 50
        { message: event.data.message, source: event.data.source, line: event.data.line },
      ]);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [handleIframeMessage]);

  useEffect(() => {
    if (reqSent.current) return;
    reqSent.current = true;
    api.get(`/projects/${id}`).then(res => {
      initProject(res.data);
    }).catch(err => {
      console.error(err);
      toast.error('Failed to load project');
      navigate('/dashboard');
    });
  }, [id, initProject, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/projects/${id}`, { files, siteName, updatedAt: new Date() });
      markSaved();
      toast.success('Project saved!');
    } catch (err) {
      console.error(err);
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChatSubmit = async (e, overridePrompt = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const userMsg = overridePrompt !== null ? overridePrompt : prompt;
    if (!userMsg.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setPrompt('');
    setIsGenerating(true);
    
    try {
      const res = await api.post('/ai/chat', { 
        prompt: userMsg, 
        currentProject: { files }
      });
      const data = res.data;
      const systemMsg = { role: 'system', text: data.message };
      if (data.action === 'suggestions') systemMsg.suggestions = data.payload;
      setMessages(prev => [...prev, systemMsg]);
      
      if (data.action === 'updateFile') {
         updateFile(data.payload.filename, data.payload.content);
         setActiveFile(data.payload.filename);
      } else if (data.action === 'updateMultipleFiles') {
         Object.entries(data.payload).forEach(([filename, content]) => {
             updateFile(filename, content);
         });
      }
    } catch (err) {
      console.error(err);
      toast.error('AI chat failed.');
    } finally {
      setIsGenerating(false);
    }
  };



  const getViewportWidth = () => {
    switch(viewport) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  const getCompiledSrcDoc = () => {
    if (!files || !files['index.html']) return '';
    let html = files['index.html'];
    // Inlining CSS: Targets styles.css with any path prefix (./or /)
    html = html.replace(/<link[^>]+href=["']?(\.\/|\/)?styles\.css["']?[^>]*>/gi, `<style>${files['styles.css'] || ''}</style>`);

    // Navigation interceptor: prevents ALL link/button clicks from navigating
    // the iframe away. Internal hash-links (#section) are converted to smooth-scroll.
    const navInterceptor = `
<script>
(function() {
  // Block navigation — convert hash links to smooth scroll, block everything else
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a');
    if (!target) return;
    var href = target.getAttribute('href');
    if (!href || href === '#') { e.preventDefault(); return; }
    if (href.startsWith('#')) {
      e.preventDefault();
      var el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    // Block all external / page navigations inside preview
    e.preventDefault();
  }, true);

  // Intercept window.location changes
  try {
    Object.defineProperty(window, 'location', {
      get: function() { return { href: '', hash: '', hostname: 'preview', pathname: '/' }; },
      set: function() {}
    });
  } catch(e) {}

  // Postmessage error bridge
  var _origError = window.onerror;
  window.onerror = function(msg, src, line, col, err) {
    try { parent.postMessage({ type: 'sf-console-error', message: String(msg), source: String(src||''), line: line }, '*'); } catch(e) {}
    return _origError ? _origError.apply(this, arguments) : false;
  };
  var _origConsoleError = console.error;
  console.error = function() {
    try { parent.postMessage({ type: 'sf-console-error', message: Array.prototype.join.call(arguments, ' '), source: 'console', line: null }, '*'); } catch(e) {}
    return _origConsoleError.apply(this, arguments);
  };
})();
</script>`;
    html = html.replace(/<\/head>/i, navInterceptor + '</head>');
    html = html.replace(/<script[^>]+src=["']?(\.\/|\/)?scripts\.js["']?[^>]*>\s*<\/script>/gi, `<script>${files['scripts.js'] || ''}</script>`);
    return html;
  };

  if (!files) return <div className="h-screen bg-[#05050A] text-white flex items-center justify-center">Loading Generator...</div>;

// Add actual deploy function
   const handleDeploy = async () => {
     try {
       const res = await api.post(`/projects/${id}/deploy`);
       toast.success('Deployed! Preview link copied to clipboard.');
       if (navigator.clipboard && navigator.clipboard.writeText) {
         navigator.clipboard.writeText(res.data.deployUrl).catch(() => {});
       }
     } catch {
       toast.error('Deploy failed');
     }
   };

   return (
    <div className="h-screen flex flex-col bg-[#05050A] text-white overflow-hidden">
      {/* Navbar */}
      <header className="h-[60px] border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-[#0A0A14]">
         <div className="flex items-center gap-4">
           <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white" title="Back to Dashboard"><ChevronLeft size={18} /></button>
           <h1 className="font-semibold text-sm tracking-wide">{siteName} <span className="text-xs text-white/40 ml-2 font-normal">AI Code Generator</span></h1>
         </div>
         
         <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/5">
           <button onClick={() => setViewport('desktop')} className={`p-2 rounded-md transition-colors ${viewport === 'desktop' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`} title="Desktop View"><Monitor size={16} /></button>
           <button onClick={() => setViewport('tablet')} className={`p-2 rounded-md transition-colors ${viewport === 'tablet' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`} title="Tablet View"><Tablet size={16} /></button>
           <button onClick={() => setViewport('mobile')} className={`p-2 rounded-md transition-colors ${viewport === 'mobile' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`} title="Mobile View"><Smartphone size={16} /></button>
         </div>

         <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 border-r border-white/10 pr-3">
             <button onClick={undo} disabled={history.length === 0} className="p-2 text-white/40 hover:text-white disabled:opacity-30 transition-colors rounded-lg hover:bg-white/5" title="Undo"><Undo2 size={16} /></button>
             <button onClick={redo} disabled={future.length === 0} className="p-2 text-white/40 hover:text-white disabled:opacity-30 transition-colors rounded-lg hover:bg-white/5" title="Redo"><Redo2 size={16} /></button>
           </div>
           
           <button onClick={handleSave} disabled={!isDirty || isSaving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-50 transition-colors">
             <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
           </button>

           {/* AI Assistant Button */}
           <button
             onClick={() => { setChatOpen(o => !o); if (debugOpen) setDebugOpen(false); }}
             className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors shadow-sm ${
               chatOpen
                 ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                 : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20'
             }`}
             title="AI Assistant"
           >
             <Sparkles size={15} />
             AI Assistant
           </button>

           {/* Debug Button */}
           <button
             onClick={() => { setDebugOpen(o => !o); if (chatOpen) setChatOpen(false); }}
             className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors relative ${
               debugOpen
                 ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                 : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
             }`}
             title="Debug Console"
           >
             <Bug size={15} />
             Debug
             {runtimeErrors.length > 0 && (
               <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[0.6rem] font-black w-4 h-4 rounded-full flex items-center justify-center">
                 {runtimeErrors.length > 9 ? '9+' : runtimeErrors.length}
               </span>
             )}
           </button>
           
           <button onClick={() => exportWebsite(files, siteName)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg transition-colors">
             <Download size={16} /> Export ZIP
           </button>

           <button onClick={handleDeploy} className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]">
             <Globe size={16} /> Deploy
           </button>
         </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Code Editor */}
        <div className="w-[45%] flex flex-col border-r border-white/10 bg-[#0f0f15]">
           <div className="flex items-center bg-[#0A0A14] border-b border-white/10 px-2 pt-2 gap-1 overflow-x-auto">
             {Object.keys(files || {}).map(filename => (
               <button 
                 key={filename}
                 onClick={() => setActiveFile(filename)}
                 className={`px-4 py-2 text-sm font-mono tracking-tight border-t-2 rounded-t-md transition-all flex items-center gap-2 ${activeFile === filename ? 'border-indigo-500 bg-[#0f0f15] text-white' : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'}`}
               >
                 <Code size={14} className={activeFile === filename ? "text-indigo-400" : ""} /> {filename}
               </button>
             ))}
           </div>
           <textarea
              className="flex-1 w-full bg-[#0f0f15] text-emerald-400 font-mono text-sm p-4 focus:outline-none resize-none"
              style={{ lineHeight: 1.6 }}
              spellCheck="false"
              value={(files || {})[activeFile] || ''}
              onChange={(e) => updateFile(activeFile, e.target.value)}
           />
        </div>

        {/* Right Panel: Live Preview */}
        <div className="flex-1 bg-[#050508] relative flex flex-col overflow-hidden">
            <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#0A0A14] shrink-0">
              <span className="text-xs font-semibold text-white/40 tracking-wider uppercase flex items-center gap-2"><Play size={12}/> Live Preview</span>
              <div className="flex items-center gap-1.5 bg-[#0f0f15] border border-white/10 rounded-md p-1">
                <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1 hover:bg-white/10 text-white/50 hover:text-white rounded transition-colors" title="Zoom Out"><Minus size={14}/></button>
                <span className="text-xs font-mono font-medium text-white/70 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1 hover:bg-white/10 text-white/50 hover:text-white rounded transition-colors" title="Zoom In"><Plus size={14}/></button>
                <div className="w-px h-3 bg-white/10 mx-1"></div>
                <button onClick={() => setZoom(1)} className="p-1 hover:bg-white/10 text-white/50 hover:text-white rounded transition-colors" title="Reset Zoom"><RefreshCcw size={14}/></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] py-[2%] custom-scrollbar relative">
               <div className="transition-all duration-300 ease-in-out bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] origin-top mb-10" 
                    style={{ 
                      width: getViewportWidth(), 
                      height: '100%',
                      borderRadius: viewport !== 'desktop' ? '20px' : '0',
                      transform: `scale(${zoom})`,
                      boxShadow: viewport !== 'desktop' ? '0 0 0 10px #0A0A14, 0 0 50px rgba(0,0,0,0.5)' : undefined
                    }}>
                 <iframe 
                    title="Live Preview" 
                    className="w-full h-full bg-white border-0" 
                    style={{ borderRadius: viewport !== 'desktop' ? '20px' : '0' }}
                    srcDoc={getCompiledSrcDoc()} 
                    sandbox="allow-scripts"
                 />
               </div>
            </div>
        </div>
      </div>

      {/* AI Chatbot Overlay */}
      {chatOpen && (
        <div className="absolute top-[60px] right-0 bottom-0 w-[420px] bg-[#0A0A14] border-l border-white/10 shadow-2xl flex flex-col z-50">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#11111A]">
            <h3 className="font-semibold flex items-center gap-2"><Sparkles size={16} className="text-indigo-400" /> SiteForge AI</h3>
            <button onClick={() => setChatOpen(false)} className="text-white/50 hover:text-white"><X size={18} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-xl max-w-[85%] text-[0.9rem] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white ml-auto' : 'bg-white/10 text-white/90 mr-auto border border-white/5'}`}>
                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') }} />
                {msg.suggestions && (
                  <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/10">
                    <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Proactive Tips</span>
                    {msg.suggestions.map((sug, idx) => (
                       <button key={idx} onClick={() => handleChatSubmit(null, sug.cmd)} className="text-left text-sm bg-black/40 hover:bg-indigo-500/20 text-indigo-300 p-2.5 rounded-lg border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between group">
                         <span>💡 {sug.tip}</span>
                         <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Apply →</span>
                       </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-center gap-1.5 p-3 bg-white/5 border border-white/5 rounded-xl mr-auto w-[60px] justify-center shadow-sm">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
          
          <div className="flex gap-2 overflow-x-auto px-3 py-2 bg-[#11111A] border-t border-white/5 hide-scrollbar">
            {['🌙 Dark Theme', '✨ Make Modern', '🖼 Better Images', '💎 Glassmorphism', '📐 More Spacing'].map((chip) => (
               <button key={chip} onClick={() => handleChatSubmit(null, chip)} className="text-[0.7rem] font-medium whitespace-nowrap bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 text-white/70 hover:text-white transition-colors shrink-0">
                  {chip}
               </button>
            ))}
          </div>
          
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-white/10 bg-[#11111A]">
            <div className="relative">
              <input 
                type="text" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask for 'vibrant colors', 'accessibility', etc..." 
                className="w-full bg-black/50 border border-white/10 rounded-full py-3 px-4 pr-12 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={isGenerating}
              />
              <button type="submit" disabled={!prompt.trim() || isGenerating} className="absolute right-1.5 top-1.5 p-2 bg-indigo-500 hover:bg-indigo-400 rounded-full disabled:opacity-50 transition-colors text-white shadow-md">
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Debug Panel Overlay */}
      {debugOpen && (
        <DebugPanel
          onClose={() => setDebugOpen(false)}
          runtimeErrors={runtimeErrors}
        />
      )}
    </div>
  );
}
