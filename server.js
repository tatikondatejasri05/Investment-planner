/**
 * Investment Planner — Express + NeDB Backend
 * Endpoints for investment plans, items, and run history
 */

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');
const Datastore = require('nedb-promises');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Database ──────────────────────────────────────────────────────────────────
const db = {
  plans:   Datastore.create({ filename: './data/plans.db',   autoload: true }),
  items:   Datastore.create({ filename: './data/items.db',   autoload: true }),
  runs:    Datastore.create({ filename: './data/runs.db',    autoload: true }),
};

// Ensure data folder
const fs = require('fs');
if (!fs.existsSync('./data')) fs.mkdirSync('./data');

// ── Helpers ───────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();
const err = (res, msg, code = 400) => res.status(code).json({ error: msg });

// ══════════════════════════════════════════════════════════════════════════════
//  PLANS  (/api/plans)
// ══════════════════════════════════════════════════════════════════════════════

// GET all plans
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await db.plans.find({}).sort({ createdAt: -1 });
    res.json(plans);
  } catch(e) { err(res, e.message, 500); }
});

// GET single plan + its items
app.get('/api/plans/:id', async (req, res) => {
  try {
    const plan  = await db.plans.findOne({ _id: req.params.id });
    if (!plan) return err(res, 'Plan not found', 404);
    const items = await db.items.find({ planId: req.params.id }).sort({ createdAt: 1 });
    res.json({ ...plan, items });
  } catch(e) { err(res, e.message, 500); }
});

// POST create plan
app.post('/api/plans', async (req, res) => {
  try {
    const { name, budget, description } = req.body;
    if (!name || !budget) return err(res, 'name and budget required');
    const plan = await db.plans.insert({
      _id: uuidv4(), name, budget: Number(budget),
      description: description || '', createdAt: now(), updatedAt: now()
    });
    res.status(201).json(plan);
  } catch(e) { err(res, e.message, 500); }
});

// PUT update plan
app.put('/api/plans/:id', async (req, res) => {
  try {
    const { name, budget, description } = req.body;
    const updates = { updatedAt: now() };
    if (name)   updates.name = name;
    if (budget) updates.budget = Number(budget);
    if (description !== undefined) updates.description = description;
    const n = await db.plans.update({ _id: req.params.id }, { $set: updates });
    if (!n) return err(res, 'Plan not found', 404);
    const plan = await db.plans.findOne({ _id: req.params.id });
    res.json(plan);
  } catch(e) { err(res, e.message, 500); }
});

// DELETE plan + its items
app.delete('/api/plans/:id', async (req, res) => {
  try {
    const n = await db.plans.remove({ _id: req.params.id });
    if (!n) return err(res, 'Plan not found', 404);
    await db.items.remove({ planId: req.params.id }, { multi: true });
    await db.runs.remove({ planId: req.params.id }, { multi: true });
    res.json({ deleted: true });
  } catch(e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  ITEMS  (/api/plans/:planId/items)
// ══════════════════════════════════════════════════════════════════════════════

// GET items for plan
app.get('/api/plans/:planId/items', async (req, res) => {
  try {
    const items = await db.items.find({ planId: req.params.planId }).sort({ createdAt: 1 });
    res.json(items);
  } catch(e) { err(res, e.message, 500); }
});

// POST add item
app.post('/api/plans/:planId/items', async (req, res) => {
  try {
    const { name, cost, ret } = req.body;
    if (!name || !cost || !ret) return err(res, 'name, cost, ret required');
    const plan = await db.plans.findOne({ _id: req.params.planId });
    if (!plan) return err(res, 'Plan not found', 404);
    const item = await db.items.insert({
      _id: uuidv4(), planId: req.params.planId,
      name, cost: Number(cost), ret: Number(ret), createdAt: now()
    });
    res.status(201).json(item);
  } catch(e) { err(res, e.message, 500); }
});

// DELETE item
app.delete('/api/plans/:planId/items/:itemId', async (req, res) => {
  try {
    const n = await db.items.remove({ _id: req.params.itemId, planId: req.params.planId });
    if (!n) return err(res, 'Item not found', 404);
    res.json({ deleted: true });
  } catch(e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  RUNS  (/api/plans/:planId/runs)
// ══════════════════════════════════════════════════════════════════════════════

// GET run history for plan
app.get('/api/plans/:planId/runs', async (req, res) => {
  try {
    const runs = await db.runs.find({ planId: req.params.planId }).sort({ runAt: -1 });
    res.json(runs);
  } catch(e) { err(res, e.message, 500); }
});

// GET ALL runs (global history)
app.get('/api/runs', async (req, res) => {
  try {
    const runs = await db.runs.find({}).sort({ runAt: -1 });
    res.json(runs);
  } catch(e) { err(res, e.message, 500); }
});

// POST save a run result
app.post('/api/plans/:planId/runs', async (req, res) => {
  try {
    const { budget, itemCount, greedyReturn, dpReturn, winner,
            greedyItems, dpItems } = req.body;
    const run = await db.runs.insert({
      _id: uuidv4(), planId: req.params.planId,
      budget, itemCount, greedyReturn, dpReturn, winner,
      greedyItems: greedyItems || [], dpItems: dpItems || [],
      runAt: now()
    });
    res.status(201).json(run);
  } catch(e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  STATS  (/api/stats)
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/stats', async (req, res) => {
  try {
    const [plans, items, runs] = await Promise.all([
      db.plans.count({}), db.items.count({}), db.runs.count({})
    ]);
    const allRuns = await db.runs.find({});
    const greedyWins = allRuns.filter(r => r.winner === 'greedy').length;
    const dpWins     = allRuns.filter(r => r.winner === 'dp').length;
    const ties       = allRuns.filter(r => r.winner === 'tie').length;
    res.json({ plans, items, runs, greedyWins, dpWins, ties });
  } catch(e) { err(res, e.message, 500); }
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  💰 Investment Planner running at http://localhost:${PORT}\n`);
});

module.exports = app;
