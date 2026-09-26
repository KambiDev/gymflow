import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { calculateClientNewExpiration } from '../services/date.service.js';

/**
 * POST /api/gym/payments
 * Registra pago de membresía de cliente y actualiza automáticamente current_expiration_date
 */
export async function registerPayment(req, res, next) {
  // TODO: Implementar con DeepSeek en Fase 5
  res.status(501).json({ message: 'Pendiente de implementación en Fase 5' });
}

/**
 * GET /api/gym/dashboard/alerts
 * Obtiene lista de clientes por vencer y vencidos para cobranza rápida
 */
export async function getAlerts(req, res, next) {
  // TODO: Implementar con DeepSeek en Fase 5
  res.status(501).json({ message: 'Pendiente de implementación en Fase 5' });
}
