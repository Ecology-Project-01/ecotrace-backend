/**
 * Setup Controller
 * Handles initial system setup tasks, such as creating the superadmin user.
 * Includes: createSuperAdmin function.
 */
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import { generateToken } from "../utils/generateToken";

const SALT_ROUNDS = 12;

export const createSuperAdmin = async (req: Request, res: Response) => {
    try {
        console.log(`[Setup] Attempting to create superadmin: ${req.body.email}`);

        const { email, username, password, org, orgSetupKey } = req.body;

        // One-time master secret check (using orgSetupKey as the gateway)
        if (orgSetupKey !== "anzz") {
            console.warn(`[Setup] Unauthorized attempt with invalid orgSetupKey from: ${req.ip}`);
            return res.status(401).json({ err: "Invalid organization setup key" });
        }

        const existingSuperAdmin = await User.findOne({ role: "superadmin" });

        if (existingSuperAdmin) {
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

        // Hashing the unique setup key if provided for this superadmin
        let hashedOrgKey = null;
        if (orgSetupKey) {
            hashedOrgKey = await bcrypt.hash(orgSetupKey, SALT_ROUNDS);
        }

        const user = await User.create({
            email,
            username,
            password: hash,
            role: "superadmin",
            org: org || "root",
            orgSetupKey: hashedOrgKey
        });

        // Generate token for immediate use
        const token = generateToken(user);

        console.log(`[Setup] Superadmin created successfully with org: ${user.org}`);
        res.status(201).json({
            msg: "Superadmin created",
            token,
            user: { username: user.username, email: user.email, role: user.role, org: user.org }
        });

    } catch (err) {
        console.error(`[Setup] Error creating superadmin:`, err);
        res.status(500).json({ err });
    }
};


export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const currentUserRole = (req as any).user.role;
        const currentUserOrg = (req as any).user.org;
        let query: any = {};

        if (currentUserRole === "admin" || currentUserRole === "superadmin") {
            // Admins & Superadmins see users in their organization (excluding solo users if they are not the target)
            if (currentUserOrg === "solo") {
                query = { email: (req as any).user.email };
            } else {
                query = {
                    org: currentUserOrg
                };
            }
        } else {
            // Regular users only see themselves
            query = { email: (req as any).user.email };
        }

        const users = await User.find(query).select("-password -__v");
        res.json(users);

    } catch (err) {
        console.error(`[Setup] Error fetching all users:`, err);
        res.status(500).json({ err: "Failed to fetch users" });
    }
};