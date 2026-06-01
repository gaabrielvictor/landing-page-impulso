import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import projetosRoutes from "./routes/projetos.js";
import professoresRoutes from "./routes/professores.js";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/impulso_db";

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ],
    credentials: true,
  }),
);
app.use(express.json());

// Conexão com MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado ao MongoDB com sucesso!");
  })
  .catch((err) => {
    console.error("❌ Erro ao conectar ao MongoDB:", err.message);
    process.exit(1);
  });

// Rotas
app.use("/auth", authRoutes);
app.use("/projetos", projetosRoutes);
app.use("/professores", professoresRoutes); 

// Rota de health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Servidor Impulso rodando!" });
});

// Erro 404
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "Rota não encontrada.",
  });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error("Erro:", err);
  res.status(500).json({
    ok: false,
    error: "Erro interno do servidor.",
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

