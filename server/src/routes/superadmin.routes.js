import { Router } from "express";
// import { authMiddleware } from '../middlewares/auth.middleware.js';
// import { requireRole } from '../middlewares/role.middleware.js';
// import * as superadminController from '../controllers/superadmin.controller.js';

const router = Router();

// Todas las rutas de superadmin deben estar protegidas:
// router.use(authMiddleware);
// router.use(requireRole('super_admin'));

// router.get('/gyms', superadminController.getGyms);
// router.post('/gyms', superadminController.createGymManual);
// router.patch('/gyms/:id/status', superadminController.updateGymStatus);
// router.post('/gyms/:id/payments', superadminController.registerSubscriptionPayment);
// router.get('/metrics', superadminController.getMetrics);

router.get("/ping", (req, res) => {
  res.json({ message: "SuperAdmin routes ping ok" });
});

export default router;
