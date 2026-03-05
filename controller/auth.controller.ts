import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../middleware/errorHandler";

const SALT_ROUNDS = 12;

export const signup = catchAsync(async (req: Request, res: Response) => {
    const { email, password, name, deviceInfo } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
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

    res.status(201).json({
        success: true,
        token,
        user: { name: user.username, email: user.email, role: user.role || 'user', org: user.org || 'solo' }
    });
});

export const login = catchAsync(async (req: Request, res: Response) => {
    const { email, password, deviceInfo } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return res.status(401).json({ success: false, message: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    if (deviceInfo) {
        user.deviceInfo = deviceInfo;
        await user.save();
    }

    const token = generateToken(user);

    res.json({
        success: true,
        token,
        user: { name: user.username, email: user.email, role: user.role, org: user.org }
    });
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const authReq = req as AuthRequest;
    const currentRole = authReq.user.role;
    const currentOrg = authReq.user.org;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (currentRole === "admin") {
        if (targetUser.role !== "user") {
            return res.status(403).json({ success: false, message: "Admins cannot delete other admins or superadmins" });
        }
        if (targetUser.org !== currentOrg) {
            return res.status(403).json({ success: false, message: "You can only delete users in your own organization" });
        }
    }

    await User.findOneAndDelete({ email });
    res.json({ success: true, message: "User deleted successfully", email });
});

export const demoteToUser = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const authReq = req as AuthRequest;
    const currentRole = authReq.user.role;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (currentRole === "admin") {
        return res.status(403).json({ success: false, message: "Admins do not have permission to demote other administrators" });
    }

    if (targetUser.role !== "admin") {
        return res.status(400).json({ success: false, message: "User is not an Admin" });
    }

    targetUser.role = "user";
    await targetUser.save();

    res.json({
        success: true,
        message: `User demoted to regular user`,
        user: { name: targetUser.username, email: targetUser.email, role: targetUser.role, org: targetUser.org }
    });
});

export const promoteToAdmin = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const authReq = req as AuthRequest;
    const currentRole = authReq.user.role;
    const currentOrg = authReq.user.org;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (currentRole === "admin") {
        if (targetUser.org !== currentOrg) {
            return res.status(403).json({ success: false, message: "You can only promote users in your own organization" });
        }
        if (targetUser.role !== "user") {
            return res.status(400).json({ success: false, message: "User is already an Admin or Superadmin" });
        }
    }

    targetUser.role = "admin";
    await targetUser.save();

    res.json({
        success: true,
        message: `User promoted to Admin`,
        user: { name: targetUser.username, email: targetUser.email, role: targetUser.role, org: targetUser.org }
    });
});

export const addToOrg = catchAsync(async (req: Request, res: Response) => {
    const { email, orgName } = req.body;
    const authReq = req as AuthRequest;
    const currentRole = authReq.user.role;
    const currentOrg = authReq.user.org;

    if (!email || !orgName) {
        return res.status(400).json({ success: false, message: "Email and Organization Name are required" });
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (currentRole === "admin") {
        if (orgName !== currentOrg) {
            return res.status(403).json({ success: false, message: "Admins can only add users to their own organization" });
        }
        if (targetUser.role !== "user") {
            return res.status(403).json({ success: false, message: "Admins cannot modify organization for other admins or superadmins" });
        }
    }

    targetUser.org = orgName;
    await targetUser.save();

    res.json({
        success: true,
        message: `User added to organization ${orgName}`,
        user: { name: targetUser.username, email: targetUser.email, role: targetUser.role, org: targetUser.org }
    });
});

export const removeFromOrg = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const authReq = req as AuthRequest;
    const currentRole = authReq.user.role;
    const currentOrg = authReq.user.org;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (currentRole === "admin") {
        if (targetUser.org !== currentOrg) {
            return res.status(403).json({ success: false, message: "You can only remove users from your own organization" });
        }
        if (targetUser.role !== "user") {
            return res.status(403).json({ success: false, message: "Admins cannot remove other admins or superadmins from the organization" });
        }
    }

    targetUser.org = 'solo';
    await targetUser.save();

    res.json({
        success: true,
        message: "User removed from organization",
        user: { name: targetUser.username, email: targetUser.email, role: targetUser.role, org: targetUser.org }
    });
});

export const changeUsername = catchAsync(async (req: Request, res: Response) => {
    const { email, newUsername } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOneAndUpdate(
        { email },
        { username: newUsername },
        { new: true }
    );

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
        success: true,
        message: `Username updated for ${email}`,
        user: { name: user.username, email: user.email, role: user.role, org: user.org }
    });
});

export const resetUserPassword = catchAsync(async (req: Request, res: Response) => {
    const { email, newPassword, password } = req.body;
    const targetPassword = newPassword || password;

    if (!email || !targetPassword) {
        return res.status(400).json({ success: false, message: "Email and new password are required" });
    }

    if (targetPassword.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const hashedPwd = await bcrypt.hash(targetPassword, SALT_ROUNDS);

    const user = await User.findOneAndUpdate(
        { email },
        { password: hashedPwd },
        { new: true }
    );

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: `Password reset successfully for ${email}` });
});


