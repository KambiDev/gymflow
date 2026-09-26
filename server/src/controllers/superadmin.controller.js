import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

/**
 * GET /api/superadmin/gyms
 * Lista de todos los gimnasios con métricas agregadas (COUNT de clientes, NUNCA datos personales)
 */
export async function getGyms(req, res, next) {
  // TODO: Implementar con DeepSeek en Fase 3
  res.status(501).json({ message: 'Pendiente de implementación en Fase 3' });
}

/**
 * POST /api/superadmin/gyms
 * Alta manual de un gimnasio y su usuario admin (con opción a registrar su primer pago en efectivo)
 */
export async function createGymManual(req, res, next) {
  // TODO: Implementar con DeepSeek en Fase 3
  res.status(501).json({ message: 'Pendiente de implementación en Fase 3' });
}

/**
 * PATCH /api/superadmin/gyms/:id/status
 * Suspender o reactivar manualmente un gimnasio
 */
export async function updateGymStatus(req, res, next) {
  // TODO: Implementar con DeepSeek en Fase 3
  res.status(501).json({ message: 'Pendiente de implementación en Fase 3' });
}

/**
 * POST /api/superadmin/gyms/:id/payments
 * Registrar pago de suscripción del SaaS (extiende subscription_ends_at)
 */
export async function registerSubscriptionPayment(req, res, next) {
  // TODO: Implementar con DeepSeek en Fase 3
  res.status(501).json({ message: 'Pendiente de implementación en Fase 3' });
}

/**
 * GET /api/superadmin/metrics
 * Métricas globales del SaaS
 */
export async function getMetrics(req, res, next) {
  // TODO: Implementar con DeepSeek en Fase 3
  res.status(501).json({ message: 'Pendiente de implementación en Fase 3' });
}
