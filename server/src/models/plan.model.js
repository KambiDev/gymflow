import { pool } from "../config/db.js";

export async function findPlansByTenant(tenantId, db = pool) {
  const [rows] = await db.query(
    `SELECT id, name, price, duration_days, is_active
     FROM plans
     WHERE tenant_id = ? AND is_active = 1`,
    [tenantId],
  );
  return rows;
}

export async function findPlanById(id, tenantId, db = pool) {
  const [rows] = await db.query(
    `SELECT id, tenant_id, name, price, duration_days, is_active,
            created_at, updated_at
     FROM plans
     WHERE id = ? AND tenant_id = ? LIMIT 1`,
    [id, tenantId],
  );
  return rows[0] || null;
}

export async function createPlan(
  connection,
  { id, tenantId, name, price, durationDays },
) {
  await connection.query(
    `INSERT INTO plans (id, tenant_id, name, price, duration_days)
     VALUES (?, ?, ?, ?, ?)`,
    [id, tenantId, name, price, durationDays],
  );
  return { id, tenantId, name, price, durationDays };
}

export async function updatePlan(
  id,
  tenantId,
  { name, price, durationDays, isActive },
  db = pool,
) {
  await db.query(
    `UPDATE plans
     SET name = ?, price = ?, duration_days = ?, is_active = ?
     WHERE id = ? AND tenant_id = ?`,
    [name, price, durationDays, isActive, id, tenantId],
  );
}

export default {
  findPlansByTenant,
  findPlanById,
  createPlan,
  updatePlan,
};
