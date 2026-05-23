import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Função auxiliar para gerar ID único
const generateUserId = () => {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `u-${Date.now()}`;
};

/**
 * POST /auth/register
 * Registra um novo usuário
 */
router.post("/register", async (req, res) => {
  try {
    const { name, birthDate, sexo, instituicao, email, password, role } =
      req.body;

    // Validação básica
    if (
      !name ||
      !birthDate ||
      !sexo ||
      !instituicao ||
      !email ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        ok: false,
        error: "Todos os campos são obrigatórios.",
      });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        ok: false,
        error: "E-mail inválido.",
      });
    }

    // Validação de senha
    if (password.length < 6) {
      return res.status(400).json({
        ok: false,
        error: "A senha deve ter no mínimo 6 caracteres.",
      });
    }

    // Verificar se email já existe
    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        error: "duplicate_email",
      });
    }

    // Criar novo usuário
    const newUser = new User({
      id: generateUserId(),
      name: name.trim(),
      birthDate,
      sexo,
      instituicao: instituicao.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: ["aluno", "professor"].includes(role) ? role : "aluno",
    });

    await newUser.save();

    return res.status(201).json({
      ok: true,
      message: "Usuário cadastrado com sucesso.",
      user: newUser.toJSON(),
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return res.status(500).json({
      ok: false,
      error: "Erro ao cadastrar usuário. Tente novamente.",
    });
  }
});

/**
 * POST /auth/login
 * Faz login de um usuário
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "E-mail e senha são obrigatórios.",
      });
    }

    // Buscar usuário por email
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "E-mail ou senha incorretos.",
      });
    }

    // Comparar senhas
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({
        ok: false,
        error: "E-mail ou senha incorretos.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Login realizado com sucesso.",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({
      ok: false,
      error: "Erro ao fazer login. Tente novamente.",
    });
  }
});

export default router;
