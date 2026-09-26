import { findTenantById } from "../models/tenant.model.js";
import { getTenantSubscriptionStatus } from "../utils/tenant.utils.js";

export async function requireActiveTenant(req, res, next) {
  if (req.user?.role === "super_admin" || !req.user?.tenantId) {
    return res.status(403).json({
      error:
        "El super admin no tiene acceso a los datos operativos de los gimnasios.",
    });
  }

  try {
    const tenant = await findTenantById(req.user.tenantId);

    if (!tenant) {
      return res.status(404).json({ error: "Gimnasio no encontrado." });
    }

    const statusInfo = getTenantSubscriptionStatus(tenant);

    if (statusInfo.status === "suspended") {
      return res.status(403).json({
        error:
          "La suscripcion del gimnasio se encuentra suspendida o vencida.",
        status: statusInfo.status,
        reason:
          tenant.suspended_reason ||
          "Contacta al administrador para reactivar tu cuenta.",
      });
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (error) {
    next(error);
  }
}

export default requireActiveTenant;
