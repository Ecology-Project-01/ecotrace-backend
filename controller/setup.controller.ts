/**
 * Setup Controller
 * Handles initial system setup tasks, such as creating the superadmin user.
 * Includes: createSuperAdmin function.
 */
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";

const SALT_ROUNDS = 12;

export const createSuperAdmin = async (req: Request, res: Response) => {
    try {
        console.log(`[Setup] Attempting to create superadmin: ${req.body.email}`);

        const { email, username, password, setupSecret } = req.body;

        if (setupSecret !== process.env.SETUP_SECRET) {
            console.warn(`[Setup] Unauthorized attempt with invalid secret from: ${req.ip}`);
            return res.status(401).json({ err: "Invalid setup secret" });
        }

        const existing = await User.findOne({ role: "superadmin" });

        if (existing) {
            console.log(`[Setup] Superadmin already exists. Blocked creation of: ${email}`);
            return res.status(403).json({
                err: "Superadmin already exists"
            });
        }

        if (!email || !password || !username)
            return res.status(400).json({ err: "Missing fields" });

        if (password.length < 8)
            return res.status(400).json({
                err: "Password must be ≥ 8 chars"
            });

        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await User.create({
            email,
            username,
            password: hash,
            role: "superadmin",
            org: "root"
        });

        console.log(`[Setup] Superadmin created successfully: ${email}`);
        res.status(201).json({
            msg: "Superadmin created",
            user: { username: user.username, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error(`[Setup] Error creating superadmin:`, err);
        res.status(500).json({ err });
    }
};


export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const currentUserRole = (req as any).user.role;
        let query = {};

        if (currentUserRole === "admin") {
            query = { role: { $ne: "superadmin" } };
        }

        const users = await User.find(query).select("-password -__v");
        res.json(users);

    } catch (err) {
        console.error(`[Setup] Error fetching all users:`, err);
        res.status(500).json({ err: "Failed to fetch users" });
    }
};