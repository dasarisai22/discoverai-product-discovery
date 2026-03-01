// ─────────────────────────────────────────────────────────────
// Product Discovery API — Production-Grade Express Server
// ─────────────────────────────────────────────────────────────

// ┌──────────────────────────────────────────────────────────┐
// │  1. ENVIRONMENT — Load and validate before anything else │
// └──────────────────────────────────────────────────────────┘
const { env, validateEnv } = require("./config/env");
validateEnv(); // Fails fast on misconfiguration

// ┌──────────────────────────────────────────────────────────┐
// │  2. DEPENDENCIES                                         │
// └──────────────────────────────────────────────────────────┘
const express = require("express");
const cors = require("cors");
const products = require("./data/products.json");

// Services
const { createOpenAIClient } = require("./services/openaiClient");
const { callLLM, classifyLLMError } = require("./services/llmService");

// Middleware
const { createRateLimiter } = require("./middleware/rateLimiter");
const { globalErrorHandler, notFoundHandler } = require("./middleware/errorHandler");

// ┌──────────────────────────────────────────────────────────┐
// │  3. INITIALIZE — OpenAI client via dependency injection  │
// └──────────────────────────────────────────────────────────┘
const openai = createOpenAIClient(env.OPENAI_API_KEY);

// ┌──────────────────────────────────────────────────────────┐
// │  4. EXPRESS APP SETUP                                    │
// └──────────────────────────────────────────────────────────┘
const app = express();

// ── Global Middleware ────────────────────────────────────────

// CORS — allow frontend origin
app.use(cors());

// Body parser with size limit to prevent payload abuse.
// Default 50kb is generous for a JSON query but blocks
// multi-MB attacks that could stall the server.
app.use(express.json({ limit: env.BODY_SIZE_LIMIT }));

// Trust proxy — required for correct req.ip behind a reverse proxy
// (Nginx, Cloudflare, etc.) which is standard in production.
app.set("trust proxy", 1);

// ── Rate Limiter (only for /api/ask) ─────────────────────────
// The AI endpoint is expensive (OpenAI tokens cost money).
// Rate limiting prevents abuse without affecting catalog browsing.
const askRateLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: "Too many AI requests. Please wait before trying again.",
});

// ┌──────────────────────────────────────────────────────────┐
// │  5. ROUTES                                               │
// └──────────────────────────────────────────────────────────┘

// ── Health Check ─────────────────────────────────────────────
// Used by load balancers, Docker, Kubernetes, and monitoring
// tools to verify the service is alive and ready.
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    ai: openai ? "configured" : "not configured",
  });
});

// ── GET /api/products ────────────────────────────────────────
// Returns the product catalog with optional category/keyword filtering.
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

// ── GET /api/products/:id ────────────────────────────────────
// Returns a single product by its string ID.
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

// ── POST /api/ask ────────────────────────────────────────────
// AI-powered product discovery endpoint.
// Rate-limited to prevent token abuse.
// Response contract: { mode, summary, productIds, products }
app.post("/api/ask", askRateLimiter, async (req, res) => {
  const { query } = req.body;

  // Input validation
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ error: "A non-empty 'query' string is required." });
  }

  // Guard: OpenAI not configured
  if (!openai) {
    return res.status(503).json({
      error: "AI service is not configured. Please set the OPENAI_API_KEY environment variable.",
    });
  }

  try {
    const result = await callLLM(openai, products, query);

    res.json({
      mode: "ai",
      summary: result.summary,
      productIds: result.productIds,
      products: result.products,
    });
  } catch (err) {
    console.error("LLM Error:", err.message);

    const classified = classifyLLMError(err);
    res.status(classified.status).json({ error: classified.message });
  }
});

// ┌──────────────────────────────────────────────────────────┐
// │  6. ERROR HANDLING — must come AFTER all routes          │
// └──────────────────────────────────────────────────────────┘
app.use(notFoundHandler);       // Catches undefined routes → 404
app.use(globalErrorHandler);    // Catches thrown errors → 500

// ┌──────────────────────────────────────────────────────────┐
// │  7. SERVER START + GRACEFUL SHUTDOWN                     │
// └──────────────────────────────────────────────────────────┘
const server = app.listen(env.PORT, () => {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   🚀  Product Discovery API                 ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   Port        : ${env.PORT}`);
  console.log(`   AI Status   : ${openai ? "✅ Configured" : "❌ Not configured"}`);
  console.log(`   Rate Limit  : ${env.RATE_LIMIT_MAX_REQUESTS} req / ${env.RATE_LIMIT_WINDOW_MS / 1000}s`);
  console.log(`   Body Limit  : ${env.BODY_SIZE_LIMIT}`);
  console.log("");
  console.log("   Endpoints:");
  console.log("   GET  /health");
  console.log("   GET  /api/products");
  console.log("   GET  /api/products/:id");
  console.log("   POST /api/ask");
  console.log("");
  if (!openai) {
    console.warn("   ⚠️  OPENAI_API_KEY not set — /api/ask will return 503\n");
  }
});

// ── Graceful Shutdown ────────────────────────────────────────
// When the process receives a termination signal (e.g., from
// Docker, Kubernetes, or Ctrl+C), we stop accepting new
// connections and let in-flight requests finish before exiting.
// This prevents dropped requests during deployments.

function gracefulShutdown(signal) {
  console.log(`\n⏹️  Received ${signal}. Shutting down gracefully...`);

  server.close(() => {
    console.log("✅ All connections closed. Exiting.\n");
    process.exit(0);
  });

  // Force exit after 10s if connections don't close cleanly
  setTimeout(() => {
    console.error("❌ Forced shutdown — connections did not close in time.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ── Catch Uncaught Exceptions & Rejections ───────────────────
// In production, these indicate bugs. Log them and exit cleanly
// rather than running in a potentially corrupted state.

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  process.exit(1);
});
