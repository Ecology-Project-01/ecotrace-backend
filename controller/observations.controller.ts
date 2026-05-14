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
        breeding_status,
        location,
        location_name,
        observedAt
    } = req.body;

    // Transform location
    let sanitizedLocation: number[] = [];
    if (location && typeof location === 'object' && location.coordinates) {
        sanitizedLocation = location.coordinates.map((c: any) => Number(c));
    } else if (Array.isArray(location)) {
        sanitizedLocation = location.map((c: any) => Number(c));
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
        breeding_status: breeding_status || undefined,
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

export const updateObservation = catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    
    // Find the observation first to check ownership (optional, depending on requirements, but safe default)
    const observation = await Observation.findById(id);
    if (!observation) {
        return res.status(404).json({ success: false, message: "Observation not found" });
    }

    // Only allow update if superadmin, admin, or creator
    if (authReq.user.role !== 'superadmin' && authReq.user.role !== 'admin' && observation.contributor !== authReq.user.email) {
        return res.status(403).json({ success: false, message: "Not authorized to update this observation" });
    }

    const { taxon, count, notes, breeding_status } = req.body;

    // Use dot notation to update nested taxon fields without overwriting everything
    let updateFields: any = {};
    if (count !== undefined) updateFields.count = count;
    if (notes !== undefined) updateFields.notes = notes;
    if (breeding_status !== undefined) updateFields.breeding_status = breeding_status;

    if (taxon) {
        if (taxon.common_name !== undefined) updateFields['taxon.common_name'] = taxon.common_name;
        if (taxon.scientific_name !== undefined) updateFields['taxon.scientific_name'] = taxon.scientific_name;
        if (taxon.family !== undefined) updateFields['taxon.family'] = taxon.family;
        if (taxon.order !== undefined) updateFields['taxon.order'] = taxon.order;
        if (taxon.iucn_status !== undefined) updateFields['taxon.iucn_status'] = taxon.iucn_status;
    }

    const updatedOb = await Observation.findByIdAndUpdate(id, { $set: updateFields }, { new: true, runValidators: true });

    res.json({
        success: true,
        data: updatedOb
    });
});

