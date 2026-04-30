# 💰 InvestIQ — Investment Planner

A full-stack web app that helps you maximize investment returns using two classic algorithms:

| Algorithm | Type | Complexity |
|-----------|------|------------|
| **Fractional Knapsack** | Greedy | O(n log n) |
| **0/1 Knapsack** | Dynamic Programming | O(n × W) |

---

## ✨ Features

- **Multi-plan support** — create and save multiple investment portfolios
- **Real database** — NeDB (embedded SQLite-like, file-based JSON store)
- **Persistent run history** — every algorithm execution is saved
- **Side-by-side comparison** — Greedy vs DP with bar charts and step traces
- **Statistics dashboard** — win rates, totals, ROI metrics
- **REST API** — full CRUD for plans, items, and runs

---

## 🏗️ Project Structure

```
investment-planner/
├── server.js          # Express backend + REST API
├── package.json
├── Procfile           # Heroku/Railway deploy
├── railway.json       # Railway deploy config
├── render.yaml        # Render deploy config
├── data/              # Auto-created — NeDB database files
│   ├── plans.db
│   ├── items.db
│   └── runs.db
└── public/            # Frontend (served as static files)
    ├── index.html
    ├── style.css
    └── app.js
```

---

## 🚀 Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start

# 3. Open browser
open http://localhost:3000
```

---

## 🌐 Deploy to the Web

### Option 1: Railway (Recommended — Free tier available)
1. Push code to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo — Railway auto-detects Node.js
4. Done! ✅ Add a **Volume** at `/data` for persistent DB storage

### Option 2: Render (Free tier)
1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo, set:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
4. Add a **Disk** at mount path `/data` for persistence
5. Done! ✅

### Option 3: Heroku
```bash
heroku create your-app-name
git push heroku main
heroku open
```

### Option 4: Fly.io
```bash
fly launch
fly deploy
```

> **⚠️ Important:** For any cloud deployment, mount persistent storage at `/data` so the NeDB `.db` files survive restarts. Without a volume, data resets on redeploy.

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plans` | List all plans |
| POST | `/api/plans` | Create plan `{name, budget, description}` |
| GET | `/api/plans/:id` | Get plan + items |
| PUT | `/api/plans/:id` | Update plan |
| DELETE | `/api/plans/:id` | Delete plan + items + runs |
| GET | `/api/plans/:id/items` | List items |
| POST | `/api/plans/:id/items` | Add item `{name, cost, ret}` |
| DELETE | `/api/plans/:id/items/:itemId` | Remove item |
| POST | `/api/plans/:id/runs` | Save algorithm run result |
| GET | `/api/plans/:id/runs` | Run history for plan |
| GET | `/api/runs` | All runs (global) |
| GET | `/api/stats` | Aggregate stats |

---

## 🧮 Algorithm Details

### Greedy — Fractional Knapsack
1. Sort investments by **value/weight ratio** (return/cost) descending
2. Take as much of each as possible until budget runs out
3. If budget < item cost, take a **fraction** of that item
4. Guarantees maximum theoretical return

### DP — 0/1 Knapsack
1. Discretize budget into units (₹100 each)
2. Build table `dp[i][w]` = best return using first `i` items with capacity `w`
3. Recurrence: `dp[i][w] = max(dp[i-1][w], dp[i-1][w-cost_i] + ret_i)`
4. Backtrack table to find selected items
5. Optimal for **whole investments only** (real-world constraint)

---

## 🛠️ Tech Stack

- **Backend:** Node.js + Express 4
- **Database:** NeDB (embedded, no native binaries, file-based)
- **Frontend:** Vanilla JS + CSS (no frameworks)
- **Fonts:** Syne + Space Mono (Google Fonts)

---

## 📄 License
MIT
