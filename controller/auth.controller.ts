/**
 * Authentication Controller
 * Manages user registration and login processes.
 * Includes: signup and login functions.
 */
import { Request, Response } from "express";
const bcrypt = require("bcrypt");

import { generateToken } from "../utils/generateToken";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";

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
        const authReq = req as AuthRequest;
        const currentRole = authReq.user.role;
        const currentOrg = authReq.user.org;

        if (!email) {
            return res.status(400).json({ err: "Email is required" });
        }

        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({ err: "User not found" });
        }

        // Hierarchy Checks
        if (currentRole === "admin") {
            // Admins can only delete 'user' role members or themselves, and only in their org
            if (targetUser.role !== "user") {
                return res.status(403).json({ err: "Admins cannot delete other admins or superadmins" });
            }
            if (targetUser.org !== currentOrg) {
                return res.status(403).json({ err: "You can only delete users in your own organization" });
            }
        }

        await User.findOneAndDelete({ email });
        console.log(`[Auth] User ${email} deleted by ${authReq.user.role} (${authReq.user.userId})`);
        res.json({ msg: "User deleted successfully", email });
    } catch (err) {
        res.status(500).json({ err: "Failed to delete user" });
    }
};

export const demoteToUser = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const authReq = req as AuthRequest;
        const currentRole = authReq.user.role;
        const currentOrg = authReq.user.org;

        if (!email) {
            return res.status(400).json({ err: "Email is required" });
        }

        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({ err: "User not found" });
        }

        // Hierarchy Checks
        if (currentRole === "admin") {
            // Admins CANNOT demote other admins or superadmins
            return res.status(403).json({ err: "Admins do not have permission to demote other administrators" });
        }

        if (targetUser.role !== "admin") {
            return res.status(400).json({ err: "User is not an Admin" });
        }

        // Superadmins can demote any Admin
        targetUser.role = "user";
        await targetUser.save();

        console.log(`[Auth] User ${email} demoted to regular user by ${currentRole}`);
        res.json({
            msg: `User demoted to regular user`,
            user: { name: targetUser.username, email: targetUser.email, role: targetUser.role, org: targetUser.org }
        });

    } catch (err) {
        console.error(`[Auth] Error in demoteToUser for ${req.body.email}:`, err);
        res.status(500).json({ err: "Failed to demote user" });
    }
};

export const promoteToAdmin = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const authReq = req as AuthRequest;
        const currentRole = authReq.user.role;
        const currentOrg = authReq.user.org;

        if (!email) {
            return res.status(400).json({ err: "Email is required" });
        }

        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({ err: "User not found" });
        }

        // Hierarchy Checks
        if (currentRole === "admin") {
            // Admins can only promote users in their own org
            if (targetUser.org !== currentOrg) {
                return res.status(403).json({ err: "You can only promote users in your own organization" });
            }
            // Cannot promote someone who is already admin/superadmin (safety)
            if (targetUser.role !== "user") {
                return res.status(400).json({ err: "User is already an Admin or Superadmin" });
            }
        }

        targetUser.role = "admin";
        await targetUser.save();

        console.log(`[Auth] User ${email} promoted as Admin by ${currentRole}`);
        res.json({
            msg: `User promoted to Admin`,
            user: { name: targetUser.username, email: targetUser.email, role: targetUser.role, org: targetUser.org }
        });

    } catch (err) {
        console.error(`[Auth] Error in promoteToAdmin for ${req.body.email}:`, err);
        res.status(500).json({ err: "Failed to promote user to Admin" });
    }
};

export const addToOrg = async (req: Request, res: Response) => {
    try {
        const { email, orgName } = req.body;
        const authReq = req as AuthRequest;
        const currentRole = authReq.user.role;
        const currentOrg = authReq.user.org;

        if (!email || !orgName) {
            return res.status(400).json({ err: "Email and Organization Name are required" });
        }

        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({ err: "User not found" });
        }

        // Hierarchy Checks
        if (currentRole === "admin") {
            // Admins can only add users TO THEIR OWN organization
            if (orgName !== currentOrg) {
                return res.status(403).json({ err: "Admins can only add users to their own organization" });
            }
            // Admins cannot modify other admins/superadmins org
            if (targetUser.role !== "user") {
                return res.status(403).json({ err: "Admins cannot modify organization for other admins or superadmins" });
            }
        }

        targetUser.org = orgName;
        await targetUser.save();

        console.log(`[Auth] User ${email} added to org ${orgName} by ${currentRole}`);
        res.json({
            msg: `User added to organization ${orgName}`,
            user: { name: targetUser.username, email: targetUser.email, role: targetUser.role, org: targetUser.org }
        });
    } catch (err) {
        console.error(`[Auth] Error in addToOrg for ${req.body.email}:`, err);
        res.status(500).json({ err: "Failed to add user to organization" });
    }
};

export const removeFromOrg = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const authReq = req as AuthRequest;
        const currentRole = authReq.user.role;
        const currentOrg = authReq.user.org;

        if (!email) {
            return res.status(400).json({ err: "Email is required" });
        }

        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({ err: "User not found" });
        }

        // Hierarchy Checks
        if (currentRole === "admin") {
            // Admins can only remove users from their own org
            if (targetUser.org !== currentOrg) {
                return res.status(403).json({ err: "You can only remove users from your own organization" });
            }
            // Admins cannot remove other admins
            if (targetUser.role !== "user") {
                return res.status(403).json({ err: "Admins cannot remove other admins or superadmins from the organization" });
            }
        }

        targetUser.org = 'solo';
        await targetUser.save();

        res.json({
            msg: "User removed from organization",
            user: { name: targetUser.username, email: targetUser.email, role: targetUser.role, org: targetUser.org }
        });
    } catch (err) {
        res.status(500).json({ err: "Failed to remove user from organization" });
    }
};

export const changeUsername = async (req: Request, res: Response) => {
    try {
        const { email, newUsername } = req.body;

        if (!email) {
            return res.status(400).json({ err: "Email is required" });
        }

        const user = await User.findOneAndUpdate(
            { email },
            { username: newUsername },
            { new: true }
        );

        if (!user) {
            console.error(`[Auth] User with email ${email} not found`);
            return res.status(404).json({ err: "User not found" });
        }

        console.log(`[Auth] Username updated for ${email}`);
        return res.status(200).json({
            msg: `Username updated for ${email}`,
            user: { name: user.username, email: user.email, role: user.role, org: user.org }
        });

    } catch (err) {
        console.error("[Auth] Username change error:", err);
        res.status(500).json({ err: "Internal server error" });
    }
}

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

