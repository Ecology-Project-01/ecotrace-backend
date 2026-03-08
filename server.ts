import express, { Request, Response, NextFunction } from "express";
import os from "os";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

const xss = require("xss");

import { connectDB } from "./config/db";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import observationRoutes from "./routes/observations.routes";
import setupRoutes from "./routes/setup.routes";

dotenv.config();

if (!process.env.JWT_SECRET) {
    console.error(`JWT Secret key is missing`);
    process.exit(1);
}

connectDB();

const app = express();

app.set('trust proxy', 1); // Trust proxy headers from Cloudflare/Localtunnel

app.use(compression()); // Compress responses
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Logging

app.use(helmet());

app.use(cors({
    origin: true,
    credentials: true
}));

app.use((req: Request, res: Response, next: NextFunction) => {
    const sanitize = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;

        // 1. NoSQL Injection (mongoSanitize)
        mongoSanitize.sanitize(obj);

        // 2. XSS (xss) - Only clean strings
        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string') {
                obj[key] = xss(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        });
    };

    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    next();
});

app.use(hpp()); // Prevent HTTP Parameter Pollution

// Apply global API rate limiter
app.use('/api', apiLimiter);

// Routes
app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "EcoTrace Backend is Running!",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

// Specific route rate limiting
app.use('/auth', authLimiter, authRoutes);
app.use('/observations', apiLimiter, observationRoutes);
app.use('/system-init', apiLimiter, setupRoutes);

// Error Handling (Must be after all routes)
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;
const START_UP_TIME = new Date().toLocaleString();

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`========================================`);
    console.log(`EcoTrace Backend Started at: ${START_UP_TIME} `);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Server is running!`);
    console.log(`- Local:      http://localhost:${PORT}`);

    const interfaces = os.networkInterfaces();
    let networkIp = "";

    Object.keys(interfaces).forEach((iface) => {
        if (iface.toLowerCase().includes("virtual") || iface.toLowerCase().includes("wsl")) return;

        interfaces[iface]?.forEach((details) => {
            if (details.family === "IPv4" && !details.internal && !details.address.startsWith("192.168.56.")) {
                networkIp = details.address;
            }
        });
    });

    if (networkIp) {
        console.log(`- Network:    http://${networkIp}:${PORT}`);
    }
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
