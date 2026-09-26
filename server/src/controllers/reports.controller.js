import { pool } from '../config/db.js';

/**
 * GET /api/gym/reports/revenue
 * Reportes de ingresos por día/mes/año y desglose por método de pago (solo admin)
 */
export async function getRevenueReport(req, res, next) {
  // TODO: Implementar con DeepSeek en Fase 5
  res.status(501).json({ message: 'Pendiente de implementación en Fase 5' });
}
