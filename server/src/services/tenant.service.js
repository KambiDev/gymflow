/**
 * Calcula el estado dinámico de la suscripción del gimnasio
 * @param {Object} tenant 
 * @returns {{ status: 'trial'|'active'|'expiring_soon'|'suspended', label: string, daysRemaining?: number }}
 */
export function getTenantSubscriptionStatus(tenant) {
  const now = new Date();

  // 1. Suspensión manual forzada
  if (tenant.is_suspended) {
    return { status: 'suspended', label: 'Suspendido' };
  }

  // 2. Suscripción paga registrada
  if (tenant.subscription_ends_at) {
    const subEnd = new Date(tenant.subscription_ends_at);
    if (subEnd < now) {
      return { status: 'suspended', label: 'Vencido / Suspendido' };
    }
    const daysRemaining = Math.ceil((subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 5) {
      return { status: 'expiring_soon', label: 'Por Vencer', daysRemaining };
    }
    return { status: 'active', label: 'Activo', daysRemaining };
  }

  // 3. Período de Trial de 7 días
  const trialEnd = new Date(tenant.trial_ends_at);
  if (trialEnd >= now) {
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { status: 'trial', label: 'Periodo de Prueba', daysRemaining };
  }

  // 4. Trial expirado
  return { status: 'suspended', label: 'Trial Expirado' };
}
