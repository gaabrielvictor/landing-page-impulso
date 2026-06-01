import mongoose from "mongoose";

const projetoAvaliadorSchema = new mongoose.Schema(
  {
    projetoId: {
      type: String,
      required: true,
      index: true,
    },
    professorId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { 
    timestamps: true 
  }
);

// Índice composto para evitar duplicação (um professor não pode ser avaliador duas vezes no mesmo projeto)
projetoAvaliadorSchema.index({ projetoId: 1, professorId: 1 }, { unique: true });

const ProjetoAvaliador = mongoose.model("ProjetoAvaliador", projetoAvaliadorSchema);
export default ProjetoAvaliador;