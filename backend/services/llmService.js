// ─────────────────────────────────────────────────────────────
// LLM Service — Structured OpenAI Integration
// ─────────────────────────────────────────────────────────────

const LLM_TIMEOUT_MS = 10_000; // 10-second hard timeout

// ── Build Minimal Catalog ────────────────────────────────────
// Only send id, name, category, price, tags to GPT.
// Descriptions are intentionally excluded to save tokens.
function buildMinimalCatalog(products) {
    return products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        tags: p.tags,
    }));
}

// ── Build Prompt Messages ────────────────────────────────────
function buildMessages(minimalCatalog, userQuery) {
    const catalogJSON = JSON.stringify(minimalCatalog);

    const systemMessage = {
        role: "system",
        content: [
            "You are an AI product discovery assistant for an online tech store.",
            "You must return ONLY valid JSON and no additional text.",
            "",
            "AVAILABLE PRODUCTS:",
            catalogJSON,
            "",
            "RULES:",
            "1. Analyse the user query and select the most relevant products from the catalog above.",
            "2. Return product IDs as strings exactly as they appear in the catalog (e.g. \"P001\").",
            "3. Provide a short, friendly 1–3 sentence summary explaining your recommendations.",
            "4. If no products match, return an empty productIds array with an explanation in summary.",
            "5. Return ONLY this JSON schema, nothing else:",
            "",
            '{',
            '  "productIds": ["string"],',
            '  "summary": "string"',
            '}',
        ].join("\n"),
    };

    const userMessage = {
        role: "user",
        content: userQuery.trim(),
    };

    return [systemMessage, userMessage];
}

// ── Validate LLM Response ────────────────────────────────────
// Ensures the parsed response matches the expected contract.
// Filters out any product IDs that don't exist in the catalog.
function validateLLMResponse(parsed, validProductIds) {
    const result = {
        productIds: [],
        summary: "",
    };

    // Validate summary
    if (typeof parsed.summary === "string" && parsed.summary.trim().length > 0) {
        result.summary = parsed.summary.trim();
    } else {
        result.summary = "AI returned results but could not generate a summary.";
    }

    // Validate productIds
    if (Array.isArray(parsed.productIds)) {
        result.productIds = parsed.productIds.filter(
            (id) => typeof id === "string" && validProductIds.has(id)
        );
    }

    return result;
}

// ── Safe JSON Parse ──────────────────────────────────────────
// Since we use response_format: json_object, GPT should always
// return valid JSON. This is a defensive fallback.
function safeParseJSON(raw) {
    try {
        return JSON.parse(raw);
    } catch {
        // Fallback: try to extract JSON from markdown fences
        const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) {
            try { return JSON.parse(fenceMatch[1].trim()); } catch { /* fall through */ }
        }
        // Last resort: extract first { ... } block
        const braceMatch = raw.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            try { return JSON.parse(braceMatch[0]); } catch { /* fall through */ }
        }
    }
    return null;
}

// ── Timeout Wrapper ──────────────────────────────────────────
// Wraps a promise with a hard timeout to prevent hanging requests.
function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error("LLM_TIMEOUT"));
        }, ms);

        promise
            .then((val) => { clearTimeout(timer); resolve(val); })
            .catch((err) => { clearTimeout(timer); reject(err); });
    });
}

// ── Main: Call LLM ───────────────────────────────────────────
// Orchestrates the full LLM interaction:
//   1. Build minimal catalog
//   2. Build structured prompt
//   3. Call OpenAI with JSON response mode
//   4. Parse & validate response
//   5. Resolve full product objects
async function callLLM(openai, products, userQuery) {
    const minimalCatalog = buildMinimalCatalog(products);
    const messages = buildMessages(minimalCatalog, userQuery);

    // Build a Set of valid IDs for fast validation
    const validProductIds = new Set(products.map((p) => p.id));

    // Call OpenAI with structured JSON mode + timeout
    const completion = await withTimeout(
        openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.3,
            max_tokens: 400,
            response_format: { type: "json_object" },
            messages,
        }),
        LLM_TIMEOUT_MS
    );

    const rawContent = completion.choices[0]?.message?.content || "";

    // Parse
    const parsed = safeParseJSON(rawContent);
    if (!parsed) {
        return {
            productIds: [],
            summary: "AI returned an invalid response. Please try again.",
            products: [],
        };
    }

    // Validate
    const validated = validateLLMResponse(parsed, validProductIds);

    // Resolve full product objects for matched IDs
    const matchedProducts = validated.productIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean);

    return {
        productIds: validated.productIds,
        summary: validated.summary,
        products: matchedProducts,
    };
}

// ── Classify Error ───────────────────────────────────────────
// Maps OpenAI/timeout errors to clean HTTP status codes & messages.
function classifyLLMError(err) {
    // Timeout
    if (err.message === "LLM_TIMEOUT") {
        return {
            status: 503,
            message: "AI service timed out. Please try again.",
        };
    }

    // Rate limited
    if (err.status === 429) {
        return {
            status: 429,
            message: "AI service is rate-limited. Please try again in a moment.",
        };
    }

    // OpenAI server errors
    if (err.status >= 500) {
        return {
            status: 503,
            message: "AI service is temporarily unavailable. Please try again later.",
        };
    }

    // Catch-all
    return {
        status: 503,
        message: "AI service encountered an unexpected error. Please try again.",
    };
}

module.exports = { callLLM, classifyLLMError };
