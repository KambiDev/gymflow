import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3307;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'gymflow';

  console.log(`🔌 Conectando a MySQL en ${host}:${port} como ${user}...`);

  // Conectar sin base de datos seleccionada para poder crearla si no existe
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    console.log(`📦 Creando base de datos '${dbName}' si no existe...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);

    const sqlPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Ejecutando script de migración inicial...');
    await connection.query(sql);

    console.log('✅ Migración completada exitosamente. Todas las tablas e índices han sido creados.');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
