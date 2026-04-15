/**
 * Observation Routes
 * Defines the API endpoints for managing observations.
 * Includes: POST / and GET / routes.
 */
import { Router } from "express";
import { createObservation, getObservations, updateObservation } from "../controller/observations.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { observationSchema, observationUpdateSchema } from "../utils/schemas";

const router = Router();

router.post("/", verifyToken, validate(observationSchema), createObservation);
router.get("/", verifyToken, getObservations);
router.put("/:id", verifyToken, validate(observationUpdateSchema), updateObservation);

export default router;
