/**
 * Observation Routes
 * Defines the API endpoints for managing observations.
 * Includes: POST / and GET / routes.
 */
import { Router } from "express";
import { createObservation, getObservations } from "../controller/observations.controller";

const router = Router();

router.post("/", createObservation);
router.get("/", getObservations);

export default router;
