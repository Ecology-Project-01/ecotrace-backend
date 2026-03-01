/**
 * Observations Controller
 * Handles the creation and retrieval of ecological observations.
 * Includes: createObservation and getObservations functions.
 */
import { Request, Response } from "express";
import Observation from "../models/Observation";
import { AuthRequest } from "../middleware/auth.middleware";

export const createObservation = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userOrg = authReq.user.org || 'solo';

        console.log(`[DEBUG] Creating observation for Org: ${userOrg}`);

        const {
            contributor,
            taxon,
            count,
            notes,
            location,
            location_name,
            observedAt
        } = req.body;

        // Transform location from any format to [String, String]
        let sanitizedLocation: string[] = [];
        if (location && typeof location === 'object' && location.coordinates) {
            sanitizedLocation = location.coordinates.map((c: any) => String(c));
        } else if (Array.isArray(location)) {
            sanitizedLocation = location.map((c: any) => String(c));
        }

        // Handle location_name as an array
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

        console.log(`[DEBUG] Final Sanitized Data:`, JSON.stringify(observationData, null, 2));

        const observation = await Observation.create(observationData);

        console.log(`[DEBUG] Saved Successfully. ID: ${observation._id}, Org: ${observation.org}`);

        res.status(201).json(observation);
    } catch (err) {
        console.error(`[Observations] Create Error:`, err);
        res.status(500).json({ err });
    }
};

export const getObservations = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userOrg = authReq.user.org;
        const userRole = authReq.user.role;

        console.log(`[DEBUG] Fetching observations for Org: ${userOrg}, Role: ${userRole}`);

        const { contributor } = req.query;

        let query: any = {};

        // Privacy Logic: "solo" users are private individual entities.
        // They only see their own data. Other organizations share data within the org.
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

        const observations = await Observation.find(query)
            .sort({ createdAt: -1 });

        res.json(observations);
    } catch (err) {
        console.error(`[Observations] Fetch Error:`, err);
        res.status(500).json({ err });
    }
};
