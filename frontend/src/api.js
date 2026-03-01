// ─────────────────────────────────────────────────────────────
// Centralised API helpers for the Product Discovery frontend
// ─────────────────────────────────────────────────────────────

// In production (Netlify), VITE_API_URL points to the Render backend.
// In local dev, it falls back to localhost:4000.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**

 * @param {string} [category] 
 * @returns {Promise<Array>} 
 */
export async function fetchProducts(category) {
    const url = new URL(`${BASE}/api/products`);
    if (category && category !== "All") {
        url.searchParams.set("category", category);
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
    return res.json();
}

/**
 
 * @param {string} query 
 * @returns {Promise<{productIds: string[], summary: string, products: Array}>}
 */
export async function askAI(query) {
    const res = await fetch(`${BASE}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `AI request failed (${res.status})`);
    }
    return res.json();
}
