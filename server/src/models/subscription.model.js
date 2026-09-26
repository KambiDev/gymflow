import { pool } from "../config/db.js";

export async function createSubscriptionPayment(
  connection,
  {
    id,
    tenantId,
    periodStart,
    periodEnd,
    amount,
    method,
    notes,
    registeredByUserId,
  },
) {
  await connection.query(
    `INSERT INTO subscription_payments
       (id, tenant_id, period_start, period_end, amount, method, notes, registered_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantId,
      periodStart,
      periodEnd,
      amount,
      method,
      notes ?? null,
      registeredByUserId,
    ],
  );
  return { id, tenantId, periodStart, periodEnd, amount, method };
}

export async function findSubscriptionPaymentsByTenant(tenantId, db = pool) {
  const [rows] = await db.query(
    `SELECT id, tenant_id, period_start, period_end, amount, method, notes,
            registered_by_user_id, created_at
     FROM subscription_payments
     WHERE tenant_id = ?
     ORDER BY created_at DESC`,
    [tenantId],
  );
  return rows;
}

export default {
  createSubscriptionPayment,
  findSubscriptionPaymentsByTenant,
};
