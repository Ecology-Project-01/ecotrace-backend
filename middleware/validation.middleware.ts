import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";

// this function will reject invalid data immediately (for forms)
export const validate = (schema: ZodSchema) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: error.issues.map((err) => ({
                        path: err.path.join('.'),
                        message: err.message
                    }))
                });
                return;
            }
            res.status(500).json({ success: false, message: "Internal server error during validation" });
        }
    };
