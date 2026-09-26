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

export default {
  findTenantById,
  findTenantBySlug,
  ensureUniqueSlug,
  createTenant,
};
