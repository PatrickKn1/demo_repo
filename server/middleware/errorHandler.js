export function errorHandler(err, req, res, next) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal server error'
    });
}
