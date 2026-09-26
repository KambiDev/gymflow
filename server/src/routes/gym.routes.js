import { Router } from "express";
// import { authMiddleware } from '../middlewares/auth.middleware.js';
// import { requireActiveTenant } from '../middlewares/tenant.middleware.js';
// import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas del gym requieren autenticación y tenant activo:
// router.use(authMiddleware);
// router.use(requireActiveTenant);

// Submódulos del gym:
// router.get('/plans', plansController.getPlans);
// router.post('/plans', requireRole('admin'), plansController.createPlan);

// router.get('/clients', clientsController.getClients);
// router.post('/clients', clientsController.createClient);
// router.get('/clients/:id', clientsController.getClientById);
// router.put('/clients/:id', clientsController.updateClient);

// router.post('/payments', paymentsController.registerPayment);
// router.get('/dashboard/alerts', paymentsController.getAlerts);

// router.get('/reports/revenue', requireRole('admin'), reportsController.getRevenue);

router.get("/ping", (req, res) => {
  res.json({ message: "Gym routes ping ok" });
});

export default router;
