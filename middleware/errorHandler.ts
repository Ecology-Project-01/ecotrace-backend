import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
    status?: number;
}

export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";

    // Log the error for internal tracking (could use a logger utility here)
    console.error(`[Error] ${req.method} ${req.url}: ${message}`);
    if (status === 500) {
        console.error(err.stack);
    }

    res.status(status).json({
        success: false,
        status,
        message: process.env.NODE_ENV === 'production' && status === 500
            ? "Something went wrong on our end"
            : message,
    });
};

export const catchAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};
