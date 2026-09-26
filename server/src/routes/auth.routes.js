import { Router } from "express";
import { registerGym, login, getMe } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register-gym", registerGym);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);

export default router;
