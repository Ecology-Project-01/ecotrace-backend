/**
 * Parses JSON bodies with JSON5 so trailing commas and other common JSON mistakes
 * from clients (Postman, etc.) don't fail before routes run.
 */
import { RequestHandler } from "express";
import JSON5 from "json5";

const DEFAULT_LIMIT = 10 * 1024;
const TRIPS_POST_LIMIT = 5 * 1024 * 1024; // GPS paths can be large

export const jsonBodyParser: RequestHandler = (req, res, next) => {
    const method = req.method;
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
        return next();
    }

    const ct = req.headers["content-type"] || "";
    if (!ct.toLowerCase().includes("application/json")) {
        return next();
    }

    const pathOnly = (String(req.originalUrl ?? req.url ?? "").split("?")[0] ?? "");
    const limit =
        method === "POST" && pathOnly.startsWith("/trips")
            ? TRIPS_POST_LIMIT
            : DEFAULT_LIMIT;

    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > limit) {
            req.removeAllListeners();
            const err = Object.assign(new Error("request entity too large"), {
                status: 413,
            });
            next(err);
            return;
        }
        chunks.push(chunk);
    });

    req.on("end", () => {
        try {
            const buf = Buffer.concat(chunks);
            if (buf.length === 0) {
                req.body = {};
                return next();
            }
            req.body = JSON5.parse(buf.toString("utf8"));
            next();
        } catch (e) {
            next(e);
        }
    });

    req.on("error", next);
};
