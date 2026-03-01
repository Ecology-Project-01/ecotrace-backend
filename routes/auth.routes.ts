/**
 * Authentication Routes
 * Defines the API endpoints for user authentication.
 * Includes: POST /signup and POST /login routes.
 */
import { Router } from "express";
import { signup, login, deleteUser, addToOrg, removeFromOrg, promoteToAdmin, demoteToUser, resetUserPassword, changeUsername } from "../controller/auth.controller";
import { verifyToken, allowRoles } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);

// Admin-only routes
router.post("/deleteUser", verifyToken, allowRoles("admin", "superadmin"), deleteUser);
router.post("/addToOrg", verifyToken, allowRoles("admin", "superadmin"), addToOrg);
router.post("/removeFromOrg", verifyToken, allowRoles("admin", "superadmin"), removeFromOrg);
router.post("/promoteToAdmin", verifyToken, allowRoles("admin", "superadmin"), promoteToAdmin);
router.post("/demoteToUser", verifyToken, allowRoles("superadmin"), demoteToUser);
router.post("/reset-password", resetUserPassword);
router.put("/changeUsername", verifyToken, changeUsername);

export default router;

