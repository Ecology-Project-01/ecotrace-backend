/**
 * Setup Routes
 * Defines the API endpoints for system setup.
 * Includes: POST /superadmin route.
 */
import { Router } from "express";
import { createSuperAdmin } from "../controller/setup.controller";

const router = Router();

router.post("/superadmin", createSuperAdmin);

export default router;
