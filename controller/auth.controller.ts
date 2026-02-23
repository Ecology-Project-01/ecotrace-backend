/**
 * Authentication Controller
 * Manages user registration and login processes.
 * Includes: signup and login functions.
 */
import { Request, Response } from "express";
const bcrypt = require("bcrypt");

import { generateToken } from "../utils/generateToken";
import User from "../models/User";

const SALT_ROUNDS = 12;

export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password, name, deviceInfo } = req.body;

        if (!email) return res.status(400).json({ err: "No Email" });
        if (!password) return res.status(400).json({ err: "No Password" });
        if (!name) return res.status(400).json({ err: "No Name" });
        if (password.length < 8)
            return res.status(400).json({ err: "Password too short" });

        const exists = await User.findOne({ email });
        if (exists) {
            console.warn(`[Auth] Signup failed: User already exists (${email})`);
            return res.status(409).json({ msg: `User exists: ${email}` });
        }

        const hashedPwd = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await User.create({
            email,
            password: hashedPwd,
            username: name,
            deviceInfo
        });

        const token = generateToken(user);

        console.log(`[Auth] User Signup successful: ${email}`);
        res.status(201).json({
            token,
            user: { name: user.username, email: user.email, role: user.role || 'user', org: user.org || 'solo' }
        });

    } catch (err) {
        res.status(500).json({ err });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password, deviceInfo } = req.body;

        if (!email) return res.status(400).json({ err: "No Email" });
        if (!password) return res.status(400).json({ err: "No Password" });

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            console.warn(`[Auth] Login failed: User not found (${email})`);
            return res.status(401).json({ err: "User not found" });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            console.warn(`[Auth] Login failed: Incorrect password for ${email}`);
            return res.status(401).json({ err: "Incorrect password" });
        }

        // Update device info on login
        if (deviceInfo) {
            user.deviceInfo = deviceInfo;
            await user.save();
        }

        const token = generateToken(user);

        console.log(`[Auth] User Login successful: ${email}`);
        res.json({
            token,
            user: { name: user.username, email: user.email, role: user.role, org: user.org }
        });

    } catch (err) {
        res.status(500).json({ err });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ err: "Email is required" });
        }

        const user = await User.findOneAndDelete({ email });

        if (!user) {
            return res.status(404).json({ err: "User not found" });
        }

        res.json({ msg: "User deleted successfully", email });
    } catch (err) {
        res.status(500).json({ err: "Failed to delete user" });
    }
};

export const promoteToAdmin = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ err: "Email is required" });
        }

        const user = await User.findOneAndUpdate(
            { email },
            { role: "admin" }
        );

        if (!user) {
            console.warn(`[Auth] Update to Admin failed: User ${email} not found`);
            return res.status(404).json({ err: "User not found" });
        }

        console.log(`[Auth] User ${email} successfully promoted as Admin`);
        res.json({
            msg: `User promoted to Admin`,
            user: { name: user.username, email: user.email, role: user.role, org: user.org }
        });

    } catch (err) {
        console.error(`[Auth] Error in addAdmin for ${req.body.email}:`, err);
        res.status(500).json({ err: "Failed to promote user to Admin" });
    }
};

export const addToOrg = async (req: Request, res: Response) => {
    try {
        const { email, orgName } = req.body;
        console.log(`[Auth] Attempting to add user ${email} to org: ${orgName}`);

        if (!email || !orgName) {
            return res.status(400).json({ err: "Email and Organization Name are required" });
        }

        const user = await User.findOneAndUpdate(
            { email },
            { org: orgName },
            { new: true }
        );

        if (!user) {
            console.warn(`[Auth] Add to Org failed: User ${email} not found`);
            return res.status(404).json({ err: "User not found" });
        }

        console.log(`[Auth] User ${email} successfully added to org: ${orgName}`);
        res.json({
            msg: `User added to organization ${orgName}`,
            user: { name: user.username, email: user.email, role: user.role, org: user.org }
        });
    } catch (err) {
        console.error(`[Auth] Error in addToOrg for ${req.body.email}:`, err);
        res.status(500).json({ err: "Failed to add user to organization" });
    }
};

export const removeFromOrg = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ err: "Email is required" });
        }

        const user = await User.findOneAndUpdate(
            { email },
            { org: 'solo' },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ err: "User not found" });
        }

        res.json({
            msg: "User removed from organization",
            user: { name: user.username, email: user.email, role: user.role, org: user.org }
        });
    } catch (err) {
        res.status(500).json({ err: "Failed to remove user from organization" });
    }
};

export const resetUserPassword = async (req: Request, res: Response) => {
    try {
        const { email, newPassword, password } = req.body;
        const targetPassword = newPassword || password;

        console.log(`[Auth] Reset Password attempt for: ${email}`);

        if (!email || !targetPassword) {
            console.warn(`[Auth] Reset Password failed: Missing email or password`);
            return res.status(400).json({ err: "Email and new password are required" });
        }

        if (targetPassword.length < 8) {
            console.warn(`[Auth] Reset Password failed: Password too short for ${email}`);
            return res.status(400).json({ err: "Password must be at least 8 characters" });
        }

        const hashedPwd = await bcrypt.hash(targetPassword, SALT_ROUNDS);


        const user = await User.findOneAndUpdate(
            { email },
            { password: hashedPwd },
            { new: true }
        );

        if (!user) {
            console.warn(`[Auth] Reset Password failed: User not found (${email})`);
            return res.status(404).json({ err: "User not found" });
        }

        console.log(`[Auth] Password successfully reset for: ${email}`);
        res.json({ msg: `Password reset successfully for ${email}` });

    } catch (err) {
        console.error("[Auth] Admin password reset error:", err);
        res.status(500).json({ err: "Internal server error" });
    }
};

