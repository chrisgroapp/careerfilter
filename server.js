const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Database ─────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id          TEXT PRIMARY KEY,
      title       TEXT,
      org         TEXT,
      url         TEXT,
      stage       INTEGER DEFAULT 0,
      date        TEXT,
      contact     TEXT,
      notes       TEXT,
      strengths   JSONB DEFAULT '[]',
      values      JSONB DEFAULT '[]',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Database ready');
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Token = SHA-256(password + salt) — stateless, no sessions library needed
const SALT = process.env.TOKEN_SALT || 'career-tracker-salt-2026';

function generateToken(password) {
  return crypto.createHash('sha256').update(password + SALT).digest('hex');
}

function requireAuth(req, res, next) {
  const token = req.headers['x-auth-token'];
  const expected = generateToken(process.env.APP_PASSWORD || 'changeme');
  if (!token || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Auth endpoint ────────────────────────────────────────────────────────────
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  const correct = process.env.APP_PASSWORD || 'changeme';
  if (password !== correct) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  res.json({ token: generateToken(password) });
});

// ─── Applications CRUD ────────────────────────────────────────────────────────
app.get('/api/applications', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM applications ORDER BY updated_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/applications', requireAuth, async (req, res) => {
  const { id, title, org, url, stage, date, contact, notes, strengths, values } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO applications
         (id, title, org, url, stage, date, contact, notes, strengths, values)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [id, title, org, url, stage ?? 0, date, contact, notes,
       JSON.stringify(strengths ?? []), JSON.stringify(values ?? [])]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/applications/:id', requireAuth, async (req, res) => {
  const { title, org, url, stage, date, contact, notes, strengths, values } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE applications
       SET title=$1, org=$2, url=$3, stage=$4, date=$5,
           contact=$6, notes=$7, strengths=$8, values=$9, updated_at=NOW()
       WHERE id=$10
       RETURNING *`,
      [title, org, url, stage ?? 0, date, contact, notes,
       JSON.stringify(strengths ?? []), JSON.stringify(values ?? []),
       req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/applications/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM applications WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Catch-all — serve frontend
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
initDB()
  .then(() => app.listen(PORT, () =>
    console.log(`Career tracker running on port ${PORT}`)
  ))
  .catch(err => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
