const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getDaysRemaining(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  return Math.ceil((target.getTime() - now.getTime()) / MS_PER_DAY);
}

export function getTenantSubscriptionStatus(tenant) {
  if (!tenant) {
    return { status: "suspended", label: "Invalido" };
  }

  if (tenant.is_suspended) {
    return { status: "suspended", label: "Suspendido" };
  }

  if (tenant.subscription_ends_at) {
    const now = new Date();
    const subscriptionEndsAt = new Date(tenant.subscription_ends_at);

    if (subscriptionEndsAt <= now) {
      return { status: "suspended", label: "Vencido / Suspendido" };
    }

    const daysRemaining = getDaysRemaining(subscriptionEndsAt);

    if (daysRemaining <= 5) {
      return { status: "expiring_soon", label: "Por Vencer", daysRemaining };
    }

    return { status: "active", label: "Activo", daysRemaining };
  }

  const now = new Date();
  const trialEndsAt = new Date(tenant.trial_ends_at);

  if (now <= trialEndsAt) {
    return {
      status: "trial",
      label: "Periodo de Prueba",
      daysRemaining: getDaysRemaining(trialEndsAt),
    };
  }

  return { status: "suspended", label: "Trial Expirado" };
}

export default { getTenantSubscriptionStatus };
