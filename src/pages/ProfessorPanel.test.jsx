import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfessorPanel from "./ProfessorPanel";
import {
  getProjetoArquivoUrl,
  listarProjetosProfessor,
  salvarFeedbackProjeto,
} from "../utils/projetosApi";

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
  listarProjetosProfessor: jest.fn(),
  getProjetoArquivoUrl: jest.fn(),
  salvarFeedbackProjeto: jest.fn(),
}));

const projetoBase = {
  id: "proj-1",
  alunoEmail: "aluno@unifacisa.com",
  alunoName: "Ana Real",
  titulo: "Projeto real",
  orientador: "Docente Real",
  curso: "Sistemas de Informação",
  status: "em_avaliacao",
  statusKey: "review",
  arquivos: [{ id: "file-1", nome: "projeto.pdf" }],
  professorFeedback: "",
  professorFeedbackEm: null,
};

describe("ProfessorPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("isAdmin", "true");
    localStorage.setItem("professorEmail", "professor@unifacisa.com");
    listarProjetosProfessor.mockResolvedValue({
      ok: true,
      projetos: [projetoBase],
    });
    getProjetoArquivoUrl.mockReturnValue(
      "http://localhost:5000/projetos/proj-1/arquivo/file-1",
    );
    salvarFeedbackProjeto.mockResolvedValue({
      ok: true,
      projeto: {
        ...projetoBase,
        professorFeedback: "Necessita revisão",
        professorFeedbackEm: "2026-05-24T00:00:00.000Z",
      },
    });
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test("carrega apenas projetos em análise e exibe o nome do aluno que submeteu o PDF", async () => {
    render(<ProfessorPanel />);

    await waitFor(() => {
      expect(screen.getByText("Projeto real")).toBeInTheDocument();
    });

    expect(screen.getByText("Ana Real")).toBeInTheDocument();
    expect(
      screen.queryByText("IA aplicada ao diagnóstico precoce de doenças raras"),
    ).not.toBeInTheDocument();
    expect(listarProjetosProfessor).toHaveBeenCalled();
  });

  test("exibe o feedback salvo de forma organizada com status e data", async () => {
    listarProjetosProfessor.mockResolvedValue({
      ok: true,
      projetos: [
        {
          ...projetoBase,
          professorFeedback:
            "Necessita revisar a metodologia e reforçar os resultados.",
          professorFeedbackEm: "2026-05-24T00:00:00.000Z",
        },
      ],
    });

    render(<ProfessorPanel />);

    await waitFor(() => {
      expect(screen.getByText("Projeto real")).toBeInTheDocument();
    });

    expect(screen.getByText("Feedback enviado")).toBeInTheDocument();
    expect(screen.getByText(/Último feedback enviado/i)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        "Necessita revisar a metodologia e reforçar os resultados.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Registrado em/i)).toBeInTheDocument();
  });

  test("permite visualizar o pdf e enviar feedback para o aluno", async () => {
    render(<ProfessorPanel />);

    await waitFor(() => {
      expect(screen.getByText("Projeto real")).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /visualizar pdf/i }),
    );

    expect(getProjetoArquivoUrl).toHaveBeenCalledWith("proj-1", "file-1");

    const iframe = screen
      .getAllByTitle("Visualizar PDF")
      .find((element) => element.tagName.toLowerCase() === "iframe");

    expect(iframe).toHaveAttribute(
      "src",
      "http://localhost:5000/projetos/proj-1/arquivo/file-1",
    );

    await userEvent.type(
      screen.getByLabelText(/escrever nova avaliação/i),
      "Necessita revisão",
    );

    await userEvent.click(
      screen.getByRole("button", { name: /salvar feedback/i }),
    );

    await waitFor(() => {
      expect(salvarFeedbackProjeto).toHaveBeenCalledWith(
        "proj-1",
        "Necessita revisão",
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText("Feedback salvo com sucesso."),
      ).toBeInTheDocument();
    });
  });
});
