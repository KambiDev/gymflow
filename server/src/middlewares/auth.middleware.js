import jwt from "jsonwebtoken";

/**
 * Middleware para verificar JWT en el header Authorization: Bearer <token>
 * Inyecta el usuario decodificado en req.user:
 * { id, email, role, tenantId, fullName }
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Token de autenticación no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
