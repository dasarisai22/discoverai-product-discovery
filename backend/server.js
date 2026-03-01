// ─────────────────────────────────────────────────────────────
// Product Discovery API — Express + OpenAI
// ─────────────────────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const products = require("./data/products.json");

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── OpenAI client (lazy — only fails when actually called) ───
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── Helpers ──────────────────────────────────────────────────

/** Build a compact catalog string for the LLM prompt context */
function buildCatalogContext() {
  return products
    .map(
      (p) =>
        `[${p.id}] ${p.name} | ${p.category} | $${p.price} | Rating ${p.rating}/5 | Tags: ${p.tags.join(", ")} | ${p.description}`
    )
    .join("\n");
}

/** Try to extract JSON from a raw LLM response string */
function parseAIResponse(raw) {
  // Try direct JSON.parse first
  try {
    return JSON.parse(raw);
  } catch {
    // Fall back to extracting JSON from markdown code fences
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        /* fall through */
      }
    }
    // Last resort: look for { ... } in the text
    const braceMatch = raw.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        /* fall through */
      }
    }
  }
  // If nothing works, return a fallback
  return { productIds: [], summary: raw };
}

// ── Routes ───────────────────────────────────────────────────


app.get("/api/products", (req, res) => {
  let result = [...products];

  const { category, q } = req.query;

  if (category) {
    const cat = category.toLowerCase();
    result = result.filter((p) => p.category.toLowerCase() === cat);
  }

  if (q) {
    const term = q.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.tags.some((t) => t.toLowerCase().includes(term))
    );
  }

  res.json(result);
});

/**
 * GET /api/products/:id
 * Returns a single product by ID
 */
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

/**
 * POST /api/ask
 * Body: { "query": "user's natural language question" }
 * Returns: { "productIds": [...], "summary": "..." }
 */
app.post("/api/ask", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ error: "A non-empty 'query' string is required." });
  }

  if (!openai) {
    return res.status(503).json({
      error:
        "AI service is not configured. Please set the OPENAI_API_KEY environment variable.",
    });
  }

  try {
    const catalogContext = buildCatalogContext();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are a helpful product recommendation assistant for an online tech store.

PRODUCT CATALOG:
${catalogContext}

INSTRUCTIONS:
- Analyse the user's query and select the most relevant products from the catalog above.
- Respond with ONLY valid JSON (no markdown, no explanation outside the JSON).
- Use this exact schema:
  {
    "productIds": ["P001", "P003"],
    "summary": "A short, friendly 1–3 sentence summary explaining why these products match the query."
  }
- If no products match, return an empty productIds array and explain why in the summary.
- Always reference products by their catalog ID.`,
        },
        {
          role: "user",
          content: query.trim(),
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content || "";
    const parsed = parseAIResponse(rawContent);

    // Ensure we always return the expected shape
    const productIds = Array.isArray(parsed.productIds) ? parsed.productIds : [];
    const summary = typeof parsed.summary === "string" ? parsed.summary : "";

    // Resolve full product objects for the matched IDs
    const matchedProducts = productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    res.json({
      productIds,
      summary,
      products: matchedProducts,
    });
  } catch (err) {
    console.error("OpenAI API error:", err.message);

    const status =
      err.status === 429
        ? 429
        : err.status >= 500
        ? 502
        : 502;

    res.status(status).json({
      error:
        status === 429
          ? "AI service is rate-limited. Please try again in a moment."
          : "AI service is temporarily unavailable. Please try again later.",
    });
  }
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Product Discovery API running at http://localhost:${PORT}`);
  console.log(`   GET  /api/products`);
  console.log(`   GET  /api/products/:id`);
  console.log(`   POST /api/ask\n`);
  if (!openai) {
    console.warn("⚠️  OPENAI_API_KEY not set — /api/ask will return 503\n");
  }
});
