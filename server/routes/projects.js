const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const { readDB, writeDB } = require('../db');

// Get all projects for user
router.get('/', auth, (req, res) => {
  const db = readDB();
  res.json(db.projects.filter(p => p.userId === req.user.id));
});

// Create project
router.post('/', auth, (req, res) => {
  const { name, description, template, files, siteName } = req.body;
  const db = readDB();
  const project = {
    id: uuidv4(),
    userId: req.user.id,
    name: name || 'Untitled Project',
    description: description || '',
    template: template || 'custom',
    files: files || { 'index.html': '<h1>Empty Site</h1>', 'styles.css': '', 'scripts.js': '' },
    siteName: siteName || name || 'My Website',
    status: 'draft',
    deployUrl: null,
    analytics: { visits: Math.floor(Math.random() * 500), clicks: Math.floor(Math.random() * 200) },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.projects.push(project);
  writeDB(db);
  res.status(201).json(project);
});

// Get single project
router.get('/:id', auth, (req, res) => {
  const db = readDB();
  const project = db.projects.find(p => p.id === req.params.id && p.userId === req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// Update project
router.put('/:id', auth, (req, res) => {
  const db = readDB();
  const idx = db.projects.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  db.projects[idx] = { ...db.projects[idx], ...req.body, id: req.params.id, userId: req.user.id, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.projects[idx]);
});

// Delete project
router.delete('/:id', auth, (req, res) => {
  const db = readDB();
  const idx = db.projects.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  db.projects.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

// Deploy (mock)
router.post('/:id/deploy', auth, (req, res) => {
  const db = readDB();
  const idx = db.projects.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  const deployUrl = `http://localhost:${process.env.PORT || 5000}/preview/${req.params.id}`;
  db.projects[idx].status = 'published';
  db.projects[idx].deployUrl = deployUrl;
  db.projects[idx].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ deployUrl, status: 'published' });
});

module.exports = router;
