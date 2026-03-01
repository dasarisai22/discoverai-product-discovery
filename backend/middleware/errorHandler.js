// ─────────────────────────────────────────────────────────────
// Global Error-Handling Middleware
// ─────────────────────────────────────────────────────────────
// Express error handlers MUST have exactly 4 parameters.
// This catches any unhandled errors thrown in route handlers
// and returns a clean, safe JSON response. Never leaks stack
// traces or internal details to the client.

/**
 * Global error handler — must be registered AFTER all routes.
 * Catches synchronous throws and next(err) calls.
 */
function globalErrorHandler(err, req, res, _next) {
    // Log full error internally for debugging
    console.error(`[${new Date().toISOString()}] Unhandled Error:`, {
        method: req.method,
        path: req.originalUrl,
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });

    // Determine status code
    const status = err.status || err.statusCode || 500;

    // Never expose internal error details in production
    const isProduction = process.env.NODE_ENV === "production";
    const message = isProduction
        ? "An internal server error occurred."
        : err.message || "An internal server error occurred.";

    res.status(status).json({ error: message });
}

/**
 * 404 handler — catches requests to undefined routes.
 * Must be registered AFTER all valid routes but BEFORE the
 * global error handler.
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}

module.exports = { globalErrorHandler, notFoundHandler };
