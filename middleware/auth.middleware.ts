/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens and checking user roles.
 * Includes: verifyToken and allowRoles middleware functions.
 */
import express, { Request, Response, NextFunction } from "express";
const jwt = require('jsonwebtoken');

export interface AuthRequest extends Request {
    user?: any;
}

export const verifyToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
        return res.status(401).json({ err: "No token provided" });

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ err: "Invalid token" });
    }
};

export const allowRoles = (...roles: string[]) =>
    (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user.role))
            return res.status(403).json({ err: "Access denied" });

        next();
    };