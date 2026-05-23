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

export default router;
