import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/auth/register-gym
 * Registro público: Crea Tenant + Usuario Admin con 7 días de trial
 */
export async function registerGym(req, res, next) {
  // TODO: Implementar lógica de registro público de gym con DeepSeek
  res.status(501).json({ message: "Pendiente de implementación en Fase 2" });
}

/**
 * POST /api/auth/login
 * Iniciar sesión: Soporta super_admin, admin y reception
 */
export async function login(req, res, next) {
  // TODO: Implementar lógica de login con DeepSeek
  res.status(501).json({ message: "Pendiente de implementación en Fase 2" });
}

/**
 * GET /api/auth/me
 * Obtiene el perfil actual y estado de suscripción del gym
 */
export async function getMe(req, res, next) {
  // TODO: Implementar lógica de getMe con DeepSeek
  res.status(501).json({ message: "Pendiente de implementación en Fase 2" });
}
