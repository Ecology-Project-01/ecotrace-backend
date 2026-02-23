/**
 * Observations Controller
 * Handles the creation and retrieval of ecological observations.
 * Includes: createObservation and getObservations functions.
 */
import { Request, Response } from "express";
import Observation from "../models/Obesrvation";

export const createObservation = async (req: Request, res: Response) => {
    try {
        const { location_name, ...rest } = req.body;
        const observation = await Observation.create({
            ...rest,
            location_name // Ensure this new field is explicitly passed
        });

        console.log(
            `Observation logged: ${observation._id} by ${observation.contributor}`
        );

        res.status(201).json(observation);
    } catch (err) {
        res.status(500).json({ err });
    }
};

export const getObservations = async (req: Request, res: Response) => {
    try {
        const { contributor } = req.query;

        const query = contributor ? { contributor } : {};

        const observations = await Observation.find(query)
            .sort({ createdAt: -1 });

        res.json(observations);
    } catch (err) {
        res.status(500).json({ err });
    }
};
