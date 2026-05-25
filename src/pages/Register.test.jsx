import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Register from "./Register";
import { registerUser } from "../utils/api";

jest.mock("../utils/api", () => ({
  registerUser: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);

const renderRegister = () => render(<Register />);

const fillCommonFields = async () => {
  await userEvent.type(
    screen.getByPlaceholderText("Seu nome completo"),
    "Maria Silva",
  );

  const birthInput = screen.getByLabelText("Data de nascimento");
  await userEvent.type(birthInput, "01012000");
  await userEvent.tab();

  const sexoSelect = screen.getAllByRole("combobox")[0];
  await userEvent.selectOptions(sexoSelect, "masculino");

  const instituicaoSelect = screen.getAllByRole("combobox")[1];
  await userEvent.selectOptions(instituicaoSelect, "Sistemas de Informação");

  await userEvent.type(
    screen.getByPlaceholderText("emailusuariounifacisa.com"),
    "maria@unifacisa.com",
  );

  const [passwordInput, confirmPasswordInput] =
    screen.getAllByPlaceholderText("...........");
  await userEvent.type(passwordInput, "123456");
  await userEvent.type(confirmPasswordInput, "123456");
};

describe("Register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    registerUser.mockResolvedValue({ ok: true });
  });

  test("exibe campo de matrícula para aluno e envia o valor informado", async () => {
    renderRegister();

    await userEvent.click(screen.getByDisplayValue("aluno"));

    expect(screen.getByLabelText(/número da matrícula/i)).toBeInTheDocument();

    await fillCommonFields();

    await userEvent.type(
      screen.getByLabelText(/número da matrícula/i),
      "1234567890",
    );

    await userEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "aluno",
          matricula: "1234567890",
        }),
      );
    });
  });

  test("bloqueia o envio quando a matrícula do aluno não tem 10 dígitos", async () => {
    renderRegister();

    await userEvent.click(screen.getByDisplayValue("aluno"));
    await fillCommonFields();

    await userEvent.type(
      screen.getByLabelText(/número da matrícula/i),
      "123456789",
    );
    await userEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(
      screen.getByText("A matrícula deve ter exatamente 10 dígitos."),
    ).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });
});
