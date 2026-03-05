import rateLimit from "express-rate-limit";

// Anti-Spam rate limiter: Prevents rapid-fire submissions
export const apiLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 5, // Limit each IP to 5 requests per 10 seconds
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: "Slow down! Too many requests. Please wait a few seconds.",
    },
});

// Stricter rate limiter for authentication routes (login, register)
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 requests per hour for auth
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: "Too many login/registration attempts, please try again after an hour",
    },
});

// Very strict limiter for potentially heavy or sensitive operations
export const strictLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: "Too many requests, please slow down",
    },
});
