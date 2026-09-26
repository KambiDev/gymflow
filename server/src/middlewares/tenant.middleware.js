import { pool } from "../config/db.js";
import { getTenantSubscriptionStatus } from "../services/tenant.service.js";

/**
 * Middleware para asegurar que la petición pertenezca a un tenant válido y activo.
 * - Bloquea a super_admin de acceder a rutas de datos de gym.
 * - Inyecta req.tenantId.
 * - Verifica si el tenant no está suspendido.
 */
export async function requireActiveTenant(req, res, next) {
  // 1. Privacidad y aislamiento: super_admin jamás accede a endpoints de un gym
  if (req.user.role === "super_admin" || !req.user.tenantId) {
    return res.status(403).json({
      error:
        "El super admin no tiene acceso a los datos operativos de los gimnasios.",
    });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, name, trial_ends_at, subscription_ends_at, is_suspended, suspended_reason, alert_days_before_expiration FROM tenants WHERE id = ?",
      [req.user.tenantId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Gimnasio no encontrado" });
    }

    const tenant = rows[0];
    const statusInfo = getTenantSubscriptionStatus(tenant);

    if (statusInfo.status === "suspended") {
      return res.status(403).json({
        error: "La suscripción del gimnasio se encuentra suspendida o vencida.",
        status: statusInfo.status,
        reason:
          tenant.suspended_reason ||
          "Por favor contacta al administrador de la plataforma para reactivar tu cuenta.",
      });
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (error) {
    next(error);
  }
}
