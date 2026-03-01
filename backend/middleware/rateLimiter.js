// ─────────────────────────────────────────────────────────────
// In-Memory Rate Limiter (Zero Dependencies)
// ─────────────────────────────────────────────────────────────
// A lightweight, production-grade rate limiter using a sliding
// window approach. No Redis or external packages needed.
//
// Why not express-rate-limit? To keep dependencies minimal and
// demonstrate understanding of the underlying mechanism. In a
// multi-instance deployment, swap this for a Redis-backed limiter.

/**
 * Creates a rate-limiting middleware.
 *
 * @param {object} options
 * @param {number} options.windowMs  - Time window in milliseconds
 * @param {number} options.max       - Max requests per window per IP
 * @param {string} [options.message] - Error message on limit exceeded
 * @returns {Function} Express middleware
 */
function createRateLimiter({ windowMs, max, message }) {
    // Map<IP, Array<timestamp>>
    const hits = new Map();

    // Periodic cleanup: remove expired entries every 60s to prevent memory leaks
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, timestamps] of hits) {
            const valid = timestamps.filter((t) => now - t < windowMs);
            if (valid.length === 0) {
                hits.delete(key);
            } else {
                hits.set(key, valid);
            }
        }
    }, 60_000);

    // Allow the cleanup timer to not prevent process exit
    cleanupInterval.unref();

    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress || "unknown";
        const now = Date.now();

        // Get existing timestamps, filter to current window
        const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs);

        if (timestamps.length >= max) {
            // Calculate retry-after in seconds
            const oldestInWindow = timestamps[0];
            const retryAfterMs = windowMs - (now - oldestInWindow);
            const retryAfterSec = Math.ceil(retryAfterMs / 1000);

            res.set("Retry-After", String(retryAfterSec));
            return res.status(429).json({
                error: message || "Too many requests. Please try again later.",
                retryAfter: retryAfterSec,
            });
        }

        // Record this request
        timestamps.push(now);
        hits.set(key, timestamps);
        next();
    };
}

module.exports = { createRateLimiter };
