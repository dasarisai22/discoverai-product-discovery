// ─────────────────────────────────────────────────────────────
// OpenAI Client — Dedicated Module
// ─────────────────────────────────────────────────────────────
// Isolates the OpenAI SDK initialization into a single module.
// This enables clean dependency injection — server.js and
// llmService.js never touch the SDK directly, they receive
// the client instance. Swapping to Azure OpenAI or a mock
// client for testing becomes trivial.

const OpenAI = require("openai");

/**
 * Creates and returns an OpenAI client instance.
 * Returns null if API key is not provided (catalog-only mode).
 *
 * @param {string|null} apiKey - The OpenAI API key
 * @returns {OpenAI|null}
 */
function createOpenAIClient(apiKey) {
    if (!apiKey) return null;

    return new OpenAI({
        apiKey,
        // Defensive: set a global timeout at the SDK level as well.
        // This complements the per-request timeout in llmService.
        timeout: 15_000,
        maxRetries: 1,
    });
}

module.exports = { createOpenAIClient };
