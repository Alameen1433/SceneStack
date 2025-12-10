class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Wraps async route handlers to catch errors and pass them to next().
 * Eliminates repetitive try-catch blocks in routes.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {

    console.error("Error:", err.message);
    if (process.env.NODE_ENV !== "production") {
        console.error(err.stack);
    }

    if (err.isOperational) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ message: "Invalid JSON in request body" });
    }

    // Default
    res.status(500).json({ message: "Internal server error" });
};

module.exports = { AppError, asyncHandler, errorHandler };
