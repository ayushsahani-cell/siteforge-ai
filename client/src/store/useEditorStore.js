import { create } from 'zustand';


const useEditorStore = create((set, get) => ({
  projectId: null,
  projectName: 'Untitled Project',
  files: {
    'index.html': '<h1>Loading...</h1>',
    'styles.css': 'body { background: #000; color: #fff; }',
    'scripts.js': 'console.log("Ready");'
  },
  activeFile: 'index.html',
  siteName: 'My Website',
  viewport: 'desktop', // desktop | tablet | mobile
  isSaving: false,
  isDirty: false,
  history: [],
  future: [],

  // Init project
  initProject: (project) => set({
    projectId: project.id,
    projectName: project.name,
    files: project.files || get().files,
    siteName: project.siteName || project.name,
    activeFile: 'index.html',
    history: [],
    future: [],
    isDirty: false,
  }),

  // --- History helpers ---
  _saveHistory: () => {
    const { files } = get();
    set(state => ({
      history: [...state.history.slice(-30), { files: { ...files } }],
      future: [],
    }));
  },

  undo: () => {
    const { history, files } = get();
    if (!history.length) return;
    const prev = history[history.length - 1];
    set(state => ({
      future: [{ files: { ...files } }, ...state.future],
      history: state.history.slice(0, -1),
      files: prev.files,
      isDirty: true,
    }));
  },

  redo: () => {
    const { future, files } = get();
    if (!future.length) return;
    const next = future[0];
    set(state => ({
      history: [...state.history, { files: { ...files } }],
      future: state.future.slice(1),
      files: next.files,
      isDirty: true,
    }));
  },

  // --- Files actions ---
  setFiles: (files) => {
    get()._saveHistory();
    set({ files, isDirty: true });
  },

  updateFile: (filename, content) => {
    get()._saveHistory();
    set(state => ({
      files: { ...state.files, [filename]: content },
      isDirty: true,
    }));
  },

  setActiveFile: (filename) => set({ activeFile: filename }),



  // --- Set viewport ---
  setViewport: (viewport) => set({ viewport }),

  // --- Save state ---
  setSaving: (isSaving) => set({ isSaving }),
  setDirty: (isDirty) => set({ isDirty }),
  markSaved: () => set({ isDirty: false }),
}));

export default useEditorStore;
