import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testDbConnection } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "GymFlow SaaS API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

app.use((err, req, res, next) => {
  console.error("[server] Error no controlado:", err);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testDbConnection();
    app.listen(PORT, () => {
      console.log(`[server] GymFlow SaaS API escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("[server] No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  }
}

startServer();

export default app;
