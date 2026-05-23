import mongoose from "mongoose";

const arquivoSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    nome: {
      type: String,
      required: true,
    },
    caminhoArmazenado: {
      type: String,
      required: true,
    },
    tamanho: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    versao: {
      type: Number,
      default: 1,
    },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
    },
    alunoEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    alunoName: {
      type: String,
      required: true,
    },
    titulo: {
      type: String,
      required: true,
    },
    orientador: {
      type: String,
      required: true,
    },
    descricao: {
      type: String,
      default: "",
    },
    curso: {
      type: String,
      default: "",
    },
    arquivos: {
      type: [arquivoSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["rascunho", "enviado", "em_avaliacao", "aprovado", "rejeitado"],
      default: "rascunho",
    },
    enviadoEm: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
