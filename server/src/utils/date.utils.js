export function calculateClientNewExpiration(currentExpirationDate, durationDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let baseDate = new Date(today);

  if (currentExpirationDate) {
    const currentExp = new Date(currentExpirationDate);
    currentExp.setHours(0, 0, 0, 0);

    if (currentExp > today) {
      baseDate = new Date(currentExp);
    }
  }

  const periodStart = new Date(baseDate);
  const periodEnd = new Date(baseDate);
  periodEnd.setDate(periodEnd.getDate() + Number(durationDays));

  const formatYMD = (d) => d.toISOString().split("T")[0];

  return {
    periodStart: formatYMD(periodStart),
    periodEnd: formatYMD(periodEnd),
    daysAdded: Number(durationDays),
  };
}

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

export default {
  calculateClientNewExpiration,
  getClientStatus,
};
