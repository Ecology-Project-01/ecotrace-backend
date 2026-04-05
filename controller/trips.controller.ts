import { Request, Response } from "express";
import Trip from "../models/Trip";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../middleware/errorHandler";
import mongoose from "mongoose";

export const createTrip = catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userOrg = authReq.user.org || "solo";
    const email = authReq.user.email as string | undefined;
    if (!email) {
        return res.status(401).json({
            success: false,
            message: "Please sign out and sign in again to refresh your session.",
        });
    }

    const { name, path, distance, startTime, endTime, observations, clientId } = req.body;

    const doc = await Trip.create({
        contributor: email,
        org: userOrg,
        name,
        path: Array.isArray(path) ? path : [],
        distance: typeof distance === "number" ? distance : 0,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : new Date(),
        observations: Array.isArray(observations) ? observations : [],
        clientId: clientId || undefined,
    });

    res.status(201).json({
        success: true,
        data: doc,
    });
});

export const getTrips = catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userOrg = authReq.user.org;
    const userRole = authReq.user.role;
    const userEmail = authReq.user.email as string | undefined;
    if (!userEmail) {
        return res.status(401).json({
            success: false,
            message: "Please sign out and sign in again to refresh your session.",
        });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: Record<string, unknown> = {};

    if (userRole !== "superadmin") {
        if (userOrg === "solo") {
            query.contributor = userEmail;
        } else {
            query.org = userOrg;
        }
    }

    const trips = await Trip.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await Trip.countDocuments(query);

    res.json({
        success: true,
        count: trips.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: trips,
    });
});

export const getTripById = catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userOrg = authReq.user.org;
    const userRole = authReq.user.role;
    const userEmail = authReq.user.email as string | undefined;
    if (!userEmail) {
        return res.status(401).json({
            success: false,
            message: "Please sign out and sign in again to refresh your session.",
        });
    }

    const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid trip id" });
    }

    const trip = await Trip.findById(id);
    if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (userRole !== "superadmin") {
        if (userOrg === "solo") {
            if (trip.contributor !== userEmail) {
                return res.status(403).json({ success: false, message: "Access denied" });
            }
        } else if (trip.org !== userOrg) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
    }

    res.json({ success: true, data: trip });
});

export const deleteTrip = catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userOrg = authReq.user.org;
    const userRole = authReq.user.role;
    const userEmail = authReq.user.email as string | undefined;
    if (!userEmail) {
        return res.status(401).json({
            success: false,
            message: "Please sign out and sign in again to refresh your session.",
        });
    }

    const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid trip id" });
    }

    const trip = await Trip.findById(id);
    if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const isOwner = trip.contributor === userEmail;
    const isSuper = userRole === "superadmin";
    const isOrgAdmin = userRole === "admin" && trip.org === userOrg;

    if (!isSuper && !isOwner && !isOrgAdmin) {
        return res.status(403).json({ success: false, message: "Access denied" });
    }

    await Trip.findByIdAndDelete(id);
    res.json({ success: true, message: "Trip deleted" });
});
