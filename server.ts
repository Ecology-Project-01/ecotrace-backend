/**
 * Main Application Entry Point
 * Sets up the Express server, connects to the database, middleware, routes, and starts the server.
 * Includes: Server configuration, middleware setup (helmet, cors, rateLimit), route registration, and server startup logic.
 */
import express, { Request, Response } from "express";
import os from "os";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db";

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

app.use(helmet());
app.use(cors());
app.use(express.json());

// Request Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});



app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}));

app.get("/", (req: Request, res: Response) => {
    res.send("EcoTrace Backend is Running!");
});

app.use('/auth', authRoutes);
app.use('/observations', observationRoutes);
app.use('/system-init', setupRoutes);

const START_UP_TIME = new Date().toLocaleString();

app.listen(Number(process.env.PORT), "0.0.0.0", () => {
    console.log(`========================================`);
    console.log(`EcoTrace Backend Started at: ${START_UP_TIME} `);
    console.log(`Server is running!`);
    console.log(`- Local:      http://localhost:${process.env.PORT}`);

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
        console.log(`- Network:    http://${networkIp}:${process.env.PORT} (Use this IP for Frontend/Mobile)`);
    }
});