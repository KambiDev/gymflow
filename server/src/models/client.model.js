import { pool } from "../config/db.js";

function buildSearchClause(search, params) {
  if (!search) {
    return "";
  }

  const term = `%${search}%`;
  params.push(term, term);
  return " AND (full_name LIKE ? OR phone LIKE ?)";
}

export async function findClientsByTenant(
  tenantId,
  { search, limit, offset } = {},
  db = pool,
) {
  const params = [tenantId];
  let sql = `SELECT id, tenant_id, full_name, phone, photo_url, notes,
                    current_expiration_date, created_at, updated_at
             FROM clients
             WHERE tenant_id = ?${buildSearchClause(search, params)}
             ORDER BY created_at DESC`;

  if (limit != null) {
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset) || 0);
  }

  const [rows] = await db.query(sql, params);
  return rows;
}

export async function countClients(tenantId, { search } = {}, db = pool) {
  const params = [tenantId];
  const sql = `SELECT COUNT(*) AS total
               FROM clients
               WHERE tenant_id = ?${buildSearchClause(search, params)}`;

  const [rows] = await db.query(sql, params);
  return Number(rows[0].total);
}

export async function findClientById(id, tenantId, db = pool) {
  const [rows] = await db.query(
    `SELECT id, tenant_id, full_name, phone, photo_url, notes,
            current_expiration_date, created_at, updated_at
     FROM clients
     WHERE id = ? AND tenant_id = ? LIMIT 1`,
    [id, tenantId],
  );
  return rows[0] || null;
}

export async function createClient(
  connection,
  { id, tenantId, fullName, phone, photoUrl, notes },
) {
  await connection.query(
    `INSERT INTO clients (id, tenant_id, full_name, phone, photo_url, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, tenantId, fullName, phone, photoUrl ?? null, notes ?? null],
  );
  return { id, tenantId, fullName, phone, photoUrl, notes };
}

export async function updateClient(
  id,
  tenantId,
  { fullName, phone, photoUrl, notes },
  db = pool,
) {
  await db.query(
    `UPDATE clients
     SET full_name = ?, phone = ?, photo_url = ?, notes = ?
     WHERE id = ? AND tenant_id = ?`,
    [fullName, phone, photoUrl ?? null, notes ?? null, id, tenantId],
  );
}

export default {
  findClientsByTenant,
  countClients,
  findClientById,
  createClient,
  updateClient,
};
