// ─────────────────────────────────────────────────────────────
// Centralized Environment Validation
// ─────────────────────────────────────────────────────────────
// Validates all required and optional environment variables at
// startup. Fails fast with clear messages if misconfigured —
// no silent runtime surprises.

require("dotenv").config();

const env = {
    // ── Required ────────────────────────────────────────────────
    // OPENAI_API_KEY is not strictly required at startup (the app
    // can run in "catalog-only" mode), but we track its presence
    // so we can warn loudly and clearly.
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,

    // ── Optional with defaults ─────────────────────────────────
    PORT: parseInt(process.env.PORT, 10) || 4000,
    NODE_ENV: process.env.NODE_ENV || "development",

    // Rate limiter config (tunable via env without code changes)
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000,
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 15,

    // Request body size limit
    BODY_SIZE_LIMIT: process.env.BODY_SIZE_LIMIT || "50kb",
};

// ── Validation ───────────────────────────────────────────────
function validateEnv() {
    const warnings = [];
    const errors = [];

    // PORT must be a valid number
    if (isNaN(env.PORT) || env.PORT < 1 || env.PORT > 65535) {
        errors.push(`PORT must be a number between 1 and 65535 (got: "${process.env.PORT}")`);
    }

    // OPENAI_API_KEY presence check (warn, don't crash)
    if (!env.OPENAI_API_KEY) {
        warnings.push(
            "OPENAI_API_KEY is not set. The /api/ask endpoint will return 503."
        );
    } else if (!env.OPENAI_API_KEY.startsWith("sk-")) {
        warnings.push(
            "OPENAI_API_KEY does not start with 'sk-'. Verify it is a valid key."
        );
    }

    // Print warnings
    warnings.forEach((w) => console.warn(`⚠️  ENV WARNING: ${w}`));

    // Hard-fail on errors
    if (errors.length > 0) {
        errors.forEach((e) => console.error(`❌ ENV ERROR: ${e}`));
        console.error("\n🛑 Startup aborted due to invalid environment configuration.\n");
        process.exit(1);
    }
}

module.exports = { env, validateEnv };
