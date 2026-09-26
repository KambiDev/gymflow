import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gymflow",
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

export async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("[db] Conexión a MySQL establecida correctamente.");
    return true;
  } catch (error) {
    console.error("[db] Error al conectar con MySQL:", error.message);
    throw error;
  }
}

export default pool;
