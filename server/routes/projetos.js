import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import Project from "../models/Project.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      new Date().toISOString().slice(0, 10),
    );
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const validPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");
    if (!validPdf) {
      return cb(new Error("Apenas arquivos PDF são permitidos."));
    }
    cb(null, true);
  },
});

const createProjectResponse = (project) => ({
  id: project.id,
  alunoEmail: project.alunoEmail,
  alunoName: project.alunoName,
  titulo: project.titulo,
  orientador: project.orientador,
  curso: project.curso,
  status: project.status,
  arquivos: project.arquivos,
  enviadoEm: project.enviadoEm,
  criadoEm: project.createdAt,
  professorFeedback: project.professorFeedback || "",
  professorFeedbackEm: project.professorFeedbackEm,
});

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const deleteProjectFiles = (arquivos = []) => {
  for (const arquivo of arquivos) {
    const filePath = arquivo.caminhoArmazenado;
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  }
};

const assertProjectOwner = (project, alunoEmail) => {
  if (!alunoEmail) return "E-mail do aluno é obrigatório.";
  if (normalizeEmail(project.alunoEmail) !== normalizeEmail(alunoEmail)) {
    return "Você não tem permissão para alterar este projeto.";
  }
  return null;
};

/**
 * GET /projetos/aluno/:email
 * Lista projetos do aluno ordenados por data de criação
 */
router.get("/aluno/:email", async (req, res) => {
  try {
    const email = normalizeEmail(req.params.email);
    if (!email) {
      return res.status(400).json({ ok: false, error: "E-mail inválido." });
    }

    const projects = await Project.find({ alunoEmail: email }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      ok: true,
      projetos: projects.map(createProjectResponse),
    });
  } catch (error) {
    console.error("Erro ao listar projetos:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Erro ao listar projetos." });
  }
});

router.get("/avaliacao", async (_req, res) => {
  try {
    const projects = await Project.find({ status: "em_avaliacao" }).sort({
      enviadoEm: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      ok: true,
      projetos: projects.map(createProjectResponse),
    });
  } catch (error) {
    console.error("Erro ao listar projetos em análise:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Erro ao listar projetos." });
  }
});

router.get("/", async (_req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      projetos: projects.map(createProjectResponse),
    });
  } catch (error) {
    console.error("Erro ao listar projetos do professor:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Erro ao listar projetos." });
  }
});

router.post("/novo", upload.single("pdf"), async (req, res) => {
  try {
    const { alunoEmail, alunoName, titulo, orientador, curso = "" } = req.body;

    if (!alunoEmail || !titulo || !orientador) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res
        .status(400)
        .json({ ok: false, error: "Dados do projeto incompletos." });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, error: "PDF não enviado." });
    }

    const arquivo = {
      id: uuidv4(),
      nome: req.file.originalname,
      caminhoArmazenado: req.file.path,
      tamanho: req.file.size,
      uploadedAt: new Date(),
      versao: 1,
    };

    const project = new Project({
      id: `proj-${uuidv4()}`,
      alunoEmail: alunoEmail.trim().toLowerCase(),
      alunoName: alunoName ? alunoName.trim() : "Aluno",
      titulo: titulo.trim(),
      orientador: orientador.trim(),
      curso: String(curso).trim(),
      arquivos: [arquivo],
      status: "rascunho",
    });

    await project.save();

    return res
      .status(201)
      .json({ ok: true, projeto: createProjectResponse(project) });
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ ok: false, error: "Erro ao criar projeto." });
  }
});

/**
 * PATCH /projetos/:id/feedback
 * Salva o feedback enviado pelo professor para o projeto
 */
router.patch("/:id/feedback", async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    if (typeof feedback !== "string" || !feedback.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "Feedback é obrigatório." });
    }

    const project = await Project.findOne({ id });
    if (!project) {
      return res
        .status(404)
        .json({ ok: false, error: "Projeto não encontrado." });
    }

    project.professorFeedback = feedback.trim();
    project.professorFeedbackEm = new Date();
    await project.save();

    return res
      .status(200)
      .json({ ok: true, projeto: createProjectResponse(project) });
  } catch (error) {
    console.error("Erro ao salvar feedback do professor:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Erro ao salvar feedback." });
  }
});

/**
 * PATCH /projetos/:id
 * Atualiza título e/ou orientador de um projeto existente
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, orientador, status } = req.body;
    const alunoEmail = req.query.alunoEmail || req.body.alunoEmail;

    if (!titulo && !orientador && status === undefined) {
      return res.status(400).json({ ok: false, error: "Nada para atualizar." });
    }

    const validStatuses = new Set([
      "rascunho",
      "enviado",
      "em_avaliacao",
      "aprovado",
      "rejeitado",
    ]);

    const project = await Project.findOne({ id });
    if (!project) {
      return res
        .status(404)
        .json({ ok: false, error: "Projeto não encontrado." });
    }

    const ownerError = assertProjectOwner(project, alunoEmail);
    if (ownerError) {
      return res.status(403).json({ ok: false, error: ownerError });
    }

    if (status !== undefined) {
      const nextStatus = String(status).trim();
      if (!validStatuses.has(nextStatus)) {
        return res.status(400).json({ ok: false, error: "Status inválido." });
      }
      project.status = nextStatus;
      if (nextStatus === "em_avaliacao") {
        project.enviadoEm = new Date();
      }
    }

    if (titulo) project.titulo = String(titulo).trim();
    if (orientador) project.orientador = String(orientador).trim();

    await project.save();

    return res
      .status(200)
      .json({ ok: true, projeto: createProjectResponse(project) });
  } catch (error) {
    console.error("Erro ao atualizar projeto:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Erro ao atualizar projeto." });
  }
});

/**
 * DELETE /projetos/:id
 * Remove projeto e arquivos PDF associados
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const alunoEmail = req.query.alunoEmail;

    const project = await Project.findOne({ id });
    if (!project) {
      return res
        .status(404)
        .json({ ok: false, error: "Projeto não encontrado." });
    }

    const ownerError = assertProjectOwner(project, alunoEmail);
    if (ownerError) {
      return res.status(403).json({ ok: false, error: ownerError });
    }

    deleteProjectFiles(project.arquivos);
    await Project.deleteOne({ id });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir projeto:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Erro ao excluir projeto." });
  }
});
/**
 * GET /projetos/:id/arquivo/:fileId
 * Retorna o arquivo PDF armazenado para visualização
 */
router.get("/:id/arquivo/:fileId", async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const project = await Project.findOne({ id });
    if (!project)
      return res
        .status(404)
        .json({ ok: false, error: "Projeto não encontrado." });

    const arquivo = (project.arquivos || []).find((a) => a.id === fileId);
    if (!arquivo)
      return res
        .status(404)
        .json({ ok: false, error: "Arquivo não encontrado." });

    const filePath = arquivo.caminhoArmazenado;
    if (!filePath || !fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ ok: false, error: "Arquivo indisponível no servidor." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${arquivo.nome.replace(/\"/g, "")}"`,
    );
    return res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error("Erro ao servir arquivo:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Erro ao servir arquivo." });
  }
});
export default router;
