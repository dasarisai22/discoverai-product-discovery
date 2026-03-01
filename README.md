# DiscoverAI — Product Discovery with AI Assist

A full-stack mini product discovery app with **AI-powered natural-language search**. Built with **Express**, **React + Vite**, and **OpenAI GPT-4o-mini**.

![DiscoverAI](https://img.shields.io/badge/Stack-Express%20%2B%20React%20%2B%20OpenAI-6c5ce7?style=for-the-badge)

---

## ✨ Features

| Area | What's implemented |
|------|--------------------|
| **Backend** | Production-grade Express REST API with product catalog, category/keyword filtering, structured LLM integration via service layer, rate limiting, health endpoint, graceful shutdown |
| **Frontend** | React 19 (Vite) with dark glassmorphic UI, product cards, category filter, AI/keyword search toggle, AI summary with typewriter effect, product detail modal, skeleton loaders, error state with retry |
| **AI/LLM** | GPT-4o-mini with `response_format: { type: "json_object" }`, minimal catalog context (token-optimized), structured prompt engineering, response validation, 10s timeout |
| **Error handling** | LLM error classification (429/503), frontend error component with retry, rate limiting on `/api/ask`, global error middleware, graceful shutdown |
| **Production** | Centralized env validation, OpenAI client factory, request size limits, `/health` endpoint, uncaught exception handlers |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check — returns `{ status, uptime, timestamp, ai }` |
| `GET` | `/api/products` | List all products. Supports `?category=` and `?q=` query params |
| `GET` | `/api/products/:id` | Get a single product by ID |
| `POST` | `/api/ask` | Send `{ "query": "..." }` → AI returns `{ mode, summary, productIds, products }` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **OpenAI API key** — get one at [platform.openai.com](https://platform.openai.com)

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd Antigravity
```

### 2. Setup & run the backend

```bash
cd backend
npm install

# Create .env from the example
cp .env.example .env
# Edit .env and add your OpenAI API key:
#   OPENAI_API_KEY=sk-...

npm run dev
# → Server running at http://localhost:4000
```

### 3. Setup & run the frontend

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
# → App running at http://localhost:5173
```

### 4. Use the app

1. Open **http://localhost:5173** in your browser
2. Browse products or filter by category
3. Toggle the **AI/Keyword switch** in the search bar:
   - **AI Mode ON**: Type a natural-language query (e.g. *"budget laptops"*, *"best for gaming"*) → calls OpenAI
   - **AI Mode OFF**: Type a keyword (e.g. *"wireless"*) → fast local filter, no API call
4. See AI recommendations with a typewriter summary + matching products
5. Click any product card to view full details in a modal

---

## 🗂 Project Structure

```
Antigravity/
├── backend/
│   ├── config/
│   │   └── env.js                    # Centralized environment validation
│   ├── data/
│   │   └── products.json             # Mock catalog (36 products)
│   ├── middleware/
│   │   ├── errorHandler.js           # Global 404 + 500 error handlers
│   │   └── rateLimiter.js            # In-memory rate limiter (zero deps)
│   ├── services/
│   │   ├── llmService.js             # Structured LLM integration + validation
│   │   └── openaiClient.js           # OpenAI client factory
│   ├── server.js                     # Express app + routes + graceful shutdown
│   ├── package.json
│   ├── .env.example                  # Template for env vars
│   └── .env                          # Your API key (git-ignored)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx/css     # AI/Keyword toggle + search input
│   │   │   ├── ProductCard.jsx/css   # Reusable product card
│   │   │   ├── ProductList.jsx/css   # Grid with skeleton loader + spinner
│   │   │   ├── AISummary.jsx/css     # AI recommendation with typewriter effect
│   │   │   ├── ProductModal.jsx/css  # Product detail overlay
│   │   │   ├── CategoryFilter.jsx/css # Category pill bar
│   │   │   ├── SortControls.jsx/css  # Sort dropdown
│   │   │   ├── ErrorState.jsx/css    # Error banner with retry button
│   │   │   ├── Spinner.jsx/css       # Loading spinner overlay
│   │   │   └── ScrollToTop.jsx/css   # Scroll-to-top button
│   │   ├── api.js                    # API helper functions
│   │   ├── App.jsx / App.css         # Main app + layout
│   │   ├── index.css                 # Design system / tokens
│   │   └── main.jsx                  # Entry point
│   ├── index.html                    # SEO meta tags
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🧠 AI / LLM Design

- **Model**: `gpt-4o-mini` via OpenAI Chat Completions
- **JSON Mode**: `response_format: { type: "json_object" }` — enforces valid JSON output
- **Prompt Strategy**: System message with minimal catalog (id, name, category, price, tags only — descriptions excluded for token savings) + explicit JSON schema
- **Validation**: Parsed response is validated for correct types, and product IDs are cross-referenced against the actual catalog
- **Timeout**: 10-second hard timeout wrapper around LLM calls
- **Parsing**: Defensive 3-level fallback (direct JSON → code fence extraction → brace matching)
- **Errors**: Rate limits → 429, timeouts → 503, server failures → 503, missing key → 503

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ | — | Your OpenAI API key |
| `PORT` | No | `4000` | Backend port |
| `NODE_ENV` | No | `development` | Environment mode |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `15` | Max AI requests per window |
| `BODY_SIZE_LIMIT` | No | `50kb` | Max request body size |

> ⚠️ **Never commit `.env` files.** The `.gitignore` excludes them automatically.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express, OpenAI SDK, dotenv, cors
- **Frontend**: React 19, Vite, vanilla CSS (custom dark theme)
- **AI**: OpenAI GPT-4o-mini with structured JSON mode

---

## ⏱ Time Spent

~3 hours (backend + AI integration + frontend + styling + production hardening + README)
