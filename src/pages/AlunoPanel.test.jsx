import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AlunoPanel from "./AlunoPanel";
import { atualizarProjeto } from "../utils/projetosApi";

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
    Navigate: ({ to }) => <div data-testid="navigate">{to}</div>,
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);

jest.mock("../utils/projetosApi", () => ({
  criarProjetoComPDF: jest.fn(),
  atualizarProjeto: jest.fn(),
  listarProjetosAluno: jest.fn(),
  excluirProjeto: jest.fn(),
  getProjetoArquivoUrl: jest.fn(() => "http://localhost:5000/projetos/teste"),
}));

const mockAluno = {
  email: "aluno@unifacisa.com",
  name: "Ana Silva",
  instituicao: "Sistemas de Informação",
};

const draftProjeto = {
  id: "proj-1",
  titulo: "Projeto em rascunho",
  orientador: "Docente Teste",
  curso: "Sistemas de Informação",
  status: "Rascunho — não enviado",
  statusKey: "pending",
  arquivos: [],
  professorFeedback: "Ajuste a introdução e revise o referencial.",
  professorFeedbackEm: "2026-05-24T00:00:00.000Z",
};

describe("AlunoPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("impulso_usuario_logado", JSON.stringify(mockAluno));
    localStorage.removeItem("isAdmin");

    const api = require("../utils/projetosApi");
    api.listarProjetosAluno.mockResolvedValue({
      ok: true,
      projetos: [draftProjeto],
    });
    api.atualizarProjeto.mockResolvedValue({
      ok: true,
      projeto: {
        ...draftProjeto,
        status: "Em avaliação",
        statusKey: "review",
      },
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("permite enviar um projeto em rascunho para análise", async () => {
    render(<AlunoPanel />);

    await waitFor(() => {
      expect(screen.getByText("Projeto em rascunho")).toBeInTheDocument();
    });

    const select = screen.getByLabelText("Enviar este projeto para");
    const button = screen.getByRole("button", { name: /enviar para análise/i });

    await userEvent.selectOptions(select, "em_avaliacao");
    await userEvent.click(button);

    await waitFor(() => {
      expect(atualizarProjeto).toHaveBeenCalledWith(
        "proj-1",
        expect.objectContaining({
          alunoEmail: "aluno@unifacisa.com",
          status: "em_avaliacao",
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Em avaliação")).toBeInTheDocument();
    });
  });

  test("exibe o feedback enviado pelo professor para o aluno", async () => {
    render(<AlunoPanel />);

    await waitFor(() => {
      expect(screen.getByText("Projeto em rascunho")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Ajuste a introdução e revise o referencial."),
    ).toBeInTheDocument();
    expect(screen.getByText(/feedback do professor/i)).toBeInTheDocument();
  });
});
