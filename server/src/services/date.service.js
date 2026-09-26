/**
 * Calcula la nueva fecha de vencimiento al renovar o registrar pago de membresía
 * Regla:
 * fechaBase = max(hoy, vencimientoActual)
 * nuevoVencimiento = fechaBase + diasDelPlan
 *
 * @param {string|Date|null} currentExpirationDate - Fecha de vencimiento actual (YYYY-MM-DD)
 * @param {number} durationDays - Días de duración del plan
 * @returns {{ periodStart: string, periodEnd: string, daysAdded: number }}
 */
export function calculateClientNewExpiration(
  currentExpirationDate,
  durationDays,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let baseDate = new Date(today);

  if (currentExpirationDate) {
    const currentExp = new Date(currentExpirationDate);
    currentExp.setHours(0, 0, 0, 0);

    // Si aún no vence, extendemos a partir de la fecha de vencimiento actual
    if (currentExp > today) {
      baseDate = new Date(currentExp);
    }
  }

  const periodStart = new Date(baseDate);
  const periodEnd = new Date(baseDate);
  periodEnd.setDate(periodEnd.getDate() + Number(durationDays));

  // Formato YYYY-MM-DD
  const formatYMD = (d) => d.toISOString().split("T")[0];

  return {
    periodStart: formatYMD(periodStart),
    periodEnd: formatYMD(periodEnd),
    daysAdded: Number(durationDays),
  };
}

/**
 * Calcula el estado dinámico del cliente respecto a su fecha de vencimiento
 * @param {string|Date|null} expirationDate
 * @param {number} alertDays - Días previos para alertar (default 5)
 * @returns {{ status: 'active'|'expiring_soon'|'expired', label: string, daysRemaining: number }}
 */
export function getClientStatus(expirationDate, alertDays = 5) {
  if (!expirationDate) {
    return { status: "expired", label: "Sin Membresía", daysRemaining: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: "expired", label: "Vencido", daysRemaining };
  } else if (daysRemaining <= alertDays) {
    return { status: "expiring_soon", label: "Por Vencer", daysRemaining };
  } else {
    return { status: "active", label: "Activo", daysRemaining };
  }
}
