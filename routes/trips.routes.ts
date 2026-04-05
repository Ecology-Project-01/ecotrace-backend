import { Router } from "express";
import { createTrip, getTrips, getTripById, deleteTrip } from "../controller/trips.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { tripCreateSchema } from "../utils/schemas";

const router = Router();

router.post("/", verifyToken, validate(tripCreateSchema), createTrip);
router.get("/", verifyToken, getTrips);
router.get("/:id", verifyToken, getTripById);
router.delete("/:id", verifyToken, deleteTrip);

export default router;
