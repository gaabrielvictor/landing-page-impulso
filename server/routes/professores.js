import express from "express";
import User from "../models/User.js";

const router = express.Router();

// GET /professores - Listar todos os professores
router.get("/", async (req, res) => {
  try {
    const professores = await User.find(
      { role: "professor" },
      "id name email instituicao"
    ).sort({ name: 1 });
    
    console.log(`✅ ${professores.length} professores encontrados`);
    res.json(professores);
  } catch (error) {
    console.error("Erro ao listar professores:", error);
    res.status(500).json({ error: "Erro ao carregar professores" });
  }
});

// GET /professores/curso/:curso - Listar professores por curso
router.get("/curso/:curso", async (req, res) => {
  try {
    const { curso } = req.params;
    
    const professores = await User.find(
      { 
        role: "professor",
        instituicao: { $regex: curso, $options: "i" }
      },
      "id name email instituicao"
    ).sort({ name: 1 });
    
    res.json(professores);
  } catch (error) {
    console.error("Erro ao listar professores por curso:", error);
    res.status(500).json({ error: "Erro ao carregar professores" });
  }
});

export default router;