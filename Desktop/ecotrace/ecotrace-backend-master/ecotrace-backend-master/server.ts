import express, { Request, Response } from "express";
import os from 'os';
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDB } from './config/db';
import User from './models/User';
import Observation from './models/Obesrvation';

dotenv.config();

// Ensure JWT_SECRET is defined
if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined in environment variables");
    process.exit(1);
}

// connectDB is async, usage of await is better but top-level await requires ESM. 
// Since we are inside a function context usually or using ts-node which might support it.
// Safeguard by wrapping in IIFE or just calling it and hoping it connects before requests come in.
// Alternatively:
connectDB(); // Mongoose buffers commands, so this is actually fine without await for app startup, but await is cleaner to know when it fails.

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(
    rateLimit({
        windowMs: 15 * 50 * 1000,
        max: 100
    })
);

// Test Route
app.get("/", (req: Request, res: Response) => {
    res.send("EcoTrace Backend is Running!");
});

// Create Observation
app.post("/observations", async (req: Request, res: Response) => {
    try {
        const observationData = req.body;
        const newObservation = await Observation.create(observationData);
        console.log(`✅ Observation logged: ${newObservation._id} by ${newObservation.contributor}`);
        res.status(201).json(newObservation);
    } catch (error) {
        console.error(`Observation submission error: ${error}`);
        res.status(500).json({ err: error });
    }
});

// Get Observations
app.get("/observations", async (req: Request, res: Response) => {
    try {
        const { contributor } = req.query;
        let query = {};
        if (contributor) {
            query = { contributor };
        }

        const observations = await Observation.find(query).sort({ createdAt: -1 });
        res.json(observations);
    } catch (error) {
        console.error(`Fetch observations error: ${error}`);
        res.status(500).json({ err: error });
    }
});

const SALT_ROUNDS = 12;
const generateToken = (userId: string, duration: string = "15m") => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET as string,
        { expiresIn: duration as any }
    );
}

// Signup
app.post("/auth/signup", async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email) return res.status(400).json({ err: "No Email" });
        if (!password) return res.status(400).json({ err: "No Password" });
        if (!name) return res.status(400).json({ err: "No Name" });
        if (password.length < 8) return res.status(400).json({ err: "Password too short" });

        const isUserExist = await User.findOne({ email });
        if (isUserExist) return res.status(409).json({ msg: `User: ${email} already exists` });

        const hashedPwd = await bcrypt.hash(password, SALT_ROUNDS);

        // Map 'name' from frontend to 'username' in DB
        const user = await User.create({
            email,
            password: hashedPwd,
            username: name
        });

        console.log(`✅ User created successfully: ${email}`);

        const token = generateToken(user._id.toString(), user.tokenValidityDuration);
        res.status(201).json({ token, user: { name: user.username, email: user.email } });

    } catch (error) {
        console.error(`Signup error: ${error}`);
        res.status(500).json({ err: error });
    }
});

// Login
app.post("/auth/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email) return res.status(400).json({ err: "No Email" });
        if (!password) return res.status(400).json({ err: "No Password" });

        const user = await User.findOne({ email }).select("+password");
        if (!user) return res.status(401).json({ err: `No user found with email: ${email}` });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ err: `Incorrect password for ${email}` });

        const token = generateToken(user._id.toString(), user.tokenValidityDuration);
        res.json({ token, user: { name: user.username, email: user.email } });

    } catch (error) {
        console.error(`Login error: ${error}`);
        res.status(500).json({ err: error });
    }
});

app.listen(Number(process.env.PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${process.env.PORT}`);
    console.log(`Accessible at http://0.0.0.0:${process.env.PORT}`);

    // Log actual LAN IPs
    const interfaces = os.networkInterfaces();
    Object.keys(interfaces).forEach((iface) => {
        interfaces[iface]?.forEach((details) => {
            if (details.family === 'IPv4' && !details.internal) {
                console.log(` -> http://${details.address}:${process.env.PORT} (${iface})`);
            }
        });
    });
});