/**
 * Observation Routes
 * Defines the API endpoints for managing observations.
 * Includes: POST / and GET / routes.
 */
import { Router } from "express";
import { createObservation, getObservations } from "../controller/observations.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { observationSchema } from "../utils/schemas";

const router = Router();

router.post("/", verifyToken, validate(observationSchema), createObservation);
router.get("/", verifyToken, getObservations);

export default router;
