import { pool } from "../config/db.js";

export async function findTenantById(id, db = pool) {
  const [rows] = await db.query(
    `SELECT id, name, slug, phone, trial_ends_at, subscription_ends_at,
            is_suspended, suspended_reason, alert_days_before_expiration,
            created_at, updated_at
     FROM tenants
     WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

export async function findTenantBySlug(slug, db = pool) {
  const [rows] = await db.query(
    `SELECT id, name, slug, phone, trial_ends_at, subscription_ends_at,
            is_suspended, suspended_reason, alert_days_before_expiration,
            created_at, updated_at
     FROM tenants
     WHERE slug = ? LIMIT 1`,
    [slug],
  );
  return rows[0] || null;
}

export async function ensureUniqueSlug(connection, baseSlug) {
  let slug = baseSlug || "gym";
  let suffix = 0;

  while (true) {
    const [rows] = await connection.query(
      "SELECT id FROM tenants WHERE slug = ? LIMIT 1",
      [slug],
    );

    if (rows.length === 0) {
      return slug;
    }

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

export async function createTenant(
  connection,
  { id, name, slug, phone, trialEndsAt },
) {
  await connection.query(
    `INSERT INTO tenants (id, name, slug, phone, trial_ends_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name, slug, phone, trialEndsAt],
  );
  return { id, name, slug, phone, trialEndsAt };
}

export async function findAllTenants(db = pool) {
  const [rows] = await db.query("SELECT * FROM tenants");
  return rows;
}

export async function updateTenantStatus(
  id,
  { isSuspended, suspendedReason },
  db = pool,
) {
  await db.query(
    `UPDATE tenants
     SET is_suspended = ?, suspended_reason = ?
     WHERE id = ?`,
    [isSuspended, suspendedReason ?? null, id],
  );
}

export async function updateTenantSubscriptionEnd(
  id,
  subscriptionEndsAt,
  db = pool,
) {
  await db.query(
    `UPDATE tenants
     SET subscription_ends_at = ?
     WHERE id = ?`,
    [subscriptionEndsAt, id],
  );
}

export async function countClientsByTenant(tenantId, db = pool) {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS total FROM clients WHERE tenant_id = ?",
    [tenantId],
  );
  return Number(rows[0].total);
}

export async function countActiveClientsByTenant(tenantId, db = pool) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM clients
     WHERE tenant_id = ? AND current_expiration_date >= CURDATE()`,
    [tenantId],
  );
  return Number(rows[0].total);
}

export default {
  findTenantById,
  findTenantBySlug,
  ensureUniqueSlug,
  createTenant,
  findAllTenants,
  updateTenantStatus,
  updateTenantSubscriptionEnd,
  countClientsByTenant,
  countActiveClientsByTenant,
};
