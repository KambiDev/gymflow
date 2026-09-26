import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testDbConnection } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Ruta de health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "GymFlow SaaS API",
    timestamp: new Date().toISOString(),
  });
});

// Importación y montaje de rutas principales
// (Aquí DeepSeek conectará authRoutes, superadminRoutes y gymRoutes)
import authRoutes from "./routes/auth.routes.js";
import superadminRoutes from "./routes/superadmin.routes.js";
import gymRoutes from "./routes/gym.routes.js";

app.use("/api/auth", authRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/gym", gymRoutes);

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(
    `🚀 Servidor backend GymFlow escuchando en http://localhost:${PORT}`,
  );
  await testDbConnection();
});

export default app;
