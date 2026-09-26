import { Router } from "express";
// import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Rutas públicas de autenticación y registro
// router.post('/register-gym', authController.registerGym);
// router.post('/login', authController.login);
// router.get('/me', authMiddleware, authController.getMe);

router.get("/ping", (req, res) => {
  res.json({ message: "Auth routes ping ok" });
});

export default router;
