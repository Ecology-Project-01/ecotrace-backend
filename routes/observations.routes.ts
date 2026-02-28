/**
 * Observation Routes
 * Defines the API endpoints for managing observations.
 * Includes: POST / and GET / routes.
 */
import { Router } from "express";
import { createObservation, getObservations } from "../controller/observations.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/", verifyToken, createObservation);
router.get("/", verifyToken, getObservations);

export default router;
