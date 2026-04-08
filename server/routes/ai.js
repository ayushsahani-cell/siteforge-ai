const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Mock AI engine - generates realistic content from prompts
const aiEngine = require('../aiEngine');

// Generate full website from prompt
router.post('/generate', auth, (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });
  const result = aiEngine.generateWebsite(prompt);
  res.json(result);
});

// Regenerate a single section
router.post('/regenerate-section', auth, (req, res) => {
  const { sectionType, prompt, palette } = req.body;
  if (typeof aiEngine.regenerateSection !== 'function') {
    return res.status(501).json({ error: 'Not implemented' });
  }
  const result = aiEngine.regenerateSection(sectionType, prompt, palette);
  res.json(result);
});

// Generate text content
router.post('/content', auth, (req, res) => {
  const { type, topic, tone } = req.body;
  if (typeof aiEngine.generateContent !== 'function') {
    return res.status(501).json({ error: 'Not implemented' });
  }
  const result = aiEngine.generateContent(type, topic, tone);
  res.json(result);
});

// Chatbot response
router.post('/chat', auth, async (req, res) => {
  const { prompt, currentProject } = req.body;
  try {
    const result = await aiEngine.chat(prompt || '', currentProject || {});
    res.json(result);
  } catch (err) {
    console.error('[ChatRoute]', err);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// ─────────────────────────────────────────────────────────────
//  Debug Engine Endpoints
// ─────────────────────────────────────────────────────────────
const debugEngine = require('../debugEngine');

/**
 * POST /api/ai/debug
 * Runs static analysis on provided project files.
 * Body: { files: { 'index.html': '...', 'styles.css': '...', 'scripts.js': '...' } }
 */
router.post('/debug', auth, (req, res) => {
  const { files } = req.body;
  if (!files || typeof files !== 'object') {
    return res.status(400).json({ error: 'files object is required' });
  }
  try {
    const report = debugEngine.analyze(files);
    res.json(report);
  } catch (err) {
    console.error('[DebugEngine] analyze error:', err);
    res.status(500).json({ error: 'Debug analysis failed', details: err.message });
  }
});

/**
 * POST /api/ai/autofix
 * Runs analysis then applies all auto-fixable patches.
 * Body: { files: { 'index.html': '...', 'styles.css': '...', 'scripts.js': '...' } }
 * Returns: { original, fixed, fixLog, files (patched) }
 */
router.post('/autofix', auth, (req, res) => {
  const { files } = req.body;
  if (!files || typeof files !== 'object') {
    return res.status(400).json({ error: 'files object is required' });
  }
  try {
    const result = debugEngine.analyzeAndFix(files);
    res.json(result);
  } catch (err) {
    console.error('[DebugEngine] autofix error:', err);
    res.status(500).json({ error: 'Auto-fix failed', details: err.message });
  }
});

module.exports = router;
