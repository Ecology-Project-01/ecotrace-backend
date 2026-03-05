/**
 * Observations Controller
 * Handles the creation and retrieval of ecological observations.
 * Includes: createObservation and getObservations functions.
 */
import { Request, Response } from "express";
import Observation from "../models/Observation";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../middleware/errorHandler";

export const createObservation = catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userOrg = authReq.user.org || 'solo';

    const {
        contributor,
        taxon,
        count,
        notes,
        location,
        location_name,
        observedAt
    } = req.body;

    // Transform location
    let sanitizedLocation: string[] = [];
    if (location && typeof location === 'object' && location.coordinates) {
        sanitizedLocation = location.coordinates.map((c: any) => String(c));
    } else if (Array.isArray(location)) {
        sanitizedLocation = location.map((c: any) => String(c));
    }

    let sanitizedLocationName = location_name;
    if (typeof location_name === 'string') {
        sanitizedLocationName = location_name.split(',').map(s => s.trim());
    }

    const observationData = {
        contributor,
        org: userOrg,
        taxon,
        count: count || 1,
        notes,
        location: sanitizedLocation,
        location_name: sanitizedLocationName,
        observedDate: observedAt ? new Date(observedAt) : new Date(),
        createdDate: new Date()
    };

    const observation = await Observation.create(observationData);
    res.status(201).json({
        success: true,
        data: observation
    });
});

export const getObservations = catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userOrg = authReq.user.org;
    const userRole = authReq.user.role;

    const { contributor, category, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = {};

    if (userRole !== "superadmin") {
        if (userOrg === "solo") {
            query.contributor = authReq.user.email;
        } else {
            query.org = userOrg;
        }
    }

    if (contributor) {
        query.contributor = contributor;
    }

    if (category) {
        if (category === "Other") {
            // "Other" is a catch-all for any category not in the main list
            const standardCategories = ['Bird', 'Mammal', 'Insect', 'Plant', 'Reptile', 'Amphibian', 'Fungi'];
            query["$or"] = [
                { "taxon.category": { $nin: standardCategories } },
                { "taxon.category": { $exists: false } },
                { "taxon.category": null }
            ];
        } else {
            query["taxon.category"] = category;
        }
    }

    const observations = await Observation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await Observation.countDocuments(query);

    res.json({
        success: true,
        count: observations.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: observations
    });
});

