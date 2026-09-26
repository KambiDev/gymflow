import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  createGymManual,
  getGyms,
  registerSubscriptionPayment,
  updateGymStatus,
} from "../controllers/superadmin.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("super_admin"));

router.get("/gyms", getGyms);
router.post("/gyms", createGymManual);
router.patch("/gyms/:id/status", updateGymStatus);
router.post("/gyms/:id/payments", registerSubscriptionPayment);

export default router;
