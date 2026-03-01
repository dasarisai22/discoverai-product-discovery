

A full-stack mini product discovery app with **AI-powered natural-language search**. Built with **Express**, **React + Vite**, and **OpenAI GPT-4o-mini**.

![DiscoverAI](https://img.shields.io/badge/Stack-Express%20%2B%20React%20%2B%20OpenAI-6c5ce7?style=for-the-badge)

---



| Area | What's implemented |
|------|--------------------|
| **Backend** | Express REST API with product catalog, category/keyword filtering, and OpenAI-powered `/api/ask` endpoint |
| **Frontend** | React (Vite) with dark glassmorphic UI, product cards, category filter, AI search bar, product detail modal |
| **AI/LLM** | GPT-4o-mini with structured JSON output, full product catalog context injection, multi-fallback response parsing |
| **Error handling** | Graceful LLM failure messages (429/502/503), frontend error banners, loading skeletons |



| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/products` | List all products. Supports `?category=` and `?q=` query params |
| `GET` | `/api/products/:id` | Get a single product by ID |
| `POST` | `/api/ask` | Send `{ "query": "..." }` → AI returns `{ productIds, summary, products }` |

---




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

npm start
# → Server running at http://localhost:4000
```

### 3. Setup & run the frontend

```bash
cd frontend
npm install
npm run dev
# → App running at http://localhost:5173
```

### 4. Use the app

1. Open **http://localhost:5173** in your browser
2. Browse products or filter by category
3. Type a query in the AI search bar (e.g. *"budget laptops"*, *"best for gaming"*, *"something for music lovers"*)
4. See AI recommendations with a summary + matching products
5. Click any product card to view full details in a modal

---

## 🗂 Project Structure

```
Antigravity/
├── backend/
│   ├── data/
│   │   └── products.json          # Mock catalog (10 products)
│   ├── server.js                  # Express API + OpenAI integration
│   ├── package.json
│   ├── .env.example               # Template for env vars
│   └── .env                       # Your API key (git-ignored)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx/css  # AI search input
│   │   │   ├── ProductCard.jsx/css # Reusable product card
│   │   │   ├── ProductList.jsx/css # Grid with skeleton loader
│   │   │   ├── AISummary.jsx/css  # AI recommendation display
│   │   │   ├── ProductModal.jsx/css # Product detail overlay
│   │   │   └── CategoryFilter.jsx/css # Category pill bar
│   │   ├── api.js                 # API helper functions
│   │   ├── App.jsx / App.css      # Main app + layout
│   │   ├── index.css              # Design system / tokens
│   │   └── main.jsx               # Entry point
│   ├── index.html                 # SEO meta tags
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🧠 AI / LLM Design

- **Model**: `gpt-4o-mini` via OpenAI Chat Completions
- **Prompt**: System message with full product catalog as context + schema instructions
- **Output**: Structured JSON — `{ productIds: [...], summary: "..." }`
- **Parsing**: 3-level fallback (direct JSON → code fence extraction → brace matching)
- **Errors**: Rate limits → 429, server failures → 502, missing key → 503

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | Your OpenAI API key |
| `PORT` | No | Backend port (default: `4000`) |

> ⚠️ **Never commit `.env` files.** The `.gitignore` excludes them automatically.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express, OpenAI SDK, dotenv, cors
- **Frontend**: React 19, Vite, vanilla CSS (custom dark theme)
- **AI**: OpenAI GPT-4o-mini

---

## ⏱ Time Spent

~2.5 hours (backend + AI integration + frontend + styling + README)
