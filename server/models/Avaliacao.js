import mongoose from "mongoose";

const avaliacaoSchema = new mongoose.Schema(
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
    nota: {
      type: Number,
      min: 0,
      max: 10,
      required: true,
    },
    comentario: {
      type: String,
      required: true,
    },
  },
  { 
    timestamps: true 
  }
);

// Índice composto para evitar duplicação (um professor não pode avaliar duas vezes o mesmo projeto)
avaliacaoSchema.index({ projetoId: 1, professorId: 1 }, { unique: true });

const Avaliacao = mongoose.model("Avaliacao", avaliacaoSchema);
export default Avaliacao;