/**
 * Setup Routes
 * Defines the API endpoints for system setup.
 * Includes: POST /superadmin route.
 */
import { Router } from "express";
import { createSuperAdmin, getAllUsers } from "../controller/setup.controller";
import { verifyToken, allowRoles } from "../middleware/auth.middleware";

const router = Router();

router.post("/superadmin", createSuperAdmin);
router.get("/getAllUsers", verifyToken, allowRoles("admin", "superadmin"), getAllUsers);


export default router;
