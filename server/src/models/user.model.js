import { pool } from "../config/db.js";

export async function findUserByEmail(email, db = pool) {
  const [rows] = await db.query(
    `SELECT id, tenant_id, email, password_hash, full_name, role, is_active, created_at
     FROM users
     WHERE email = ? LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

export async function findUserById(id, db = pool) {
  const [rows] = await db.query(
    `SELECT id, tenant_id, email, full_name, role, is_active, created_at
     FROM users
     WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

export async function createUser(
  connection,
  { id, tenantId, email, passwordHash, fullName, role = "admin" },
) {
  await connection.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, tenantId, email, passwordHash, fullName, role],
  );
  return { id, tenantId, email, fullName, role };
}

export default {
  findUserByEmail,
  findUserById,
  createUser,
};
