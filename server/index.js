require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/ai', require('./routes/ai'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Local Hosting / Preview Routes
const { readDB } = require('./db');

app.get('/preview/:id', (req, res) => {
  res.redirect(`/preview/${req.params.id}/index.html`);
});

app.get('/preview/:id/:file', (req, res) => {
  const db = readDB();
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).send('Project Not Found');

  const file = req.params.file || 'index.html';
  if (!project.files || !project.files[file]) return res.status(404).send('File Not Found');

  if (file.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
  else if (file.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
  else res.setHeader('Content-Type', 'text/html');

  res.send(project.files[file]);
});

app.listen(PORT, '0.0.0.0', () => console.log(`✅ AI Website Builder API running on port ${PORT}`));
