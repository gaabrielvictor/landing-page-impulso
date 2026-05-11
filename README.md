# 🚀 Impulso Unifacisa — Landing Page

Plataforma web desenvolvida para o programa **Impulso da Unifacisa**, com landing page institucional, sistema de login administrativo e recuperação de senha.

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Fluxo da Aplicação](#fluxo-da-aplicação)
- [Como Rodar o Projeto](#como-rodar-o-projeto)
- [Credenciais de Acesso](#credenciais-de-acesso)

---

## 📌 Sobre o Projeto

Landing page institucional do programa Impulso da Unifacisa, com seções informativas e acesso restrito ao painel administrativo via autenticação de login.

---

## 🛠 Tecnologias Utilizadas

| Tecnologia | Descrição |
|---|---|
| [React](https://reactjs.org/) | Biblioteca principal para construção da interface |
| [React Router DOM](https://reactrouter.com/) | Gerenciamento de rotas e navegação entre páginas |
| [CSS3](https://developer.mozilla.org/pt-BR/docs/Web/CSS) | Estilização dos componentes |
| [Font Awesome](https://fontawesome.com/) | Ícones utilizados nos campos de formulário |
| [Google Fonts](https://fonts.google.com/) | Fontes League Spartan e Montserrat |
| [Create React App](https://create-react-app.dev/) | Configuração inicial do projeto |

---

## 📁 Estrutura de Pastas

```
src/
├── assets/              # Imagens e recursos estáticos
│   └── logo.png
├── components/          # Componentes reutilizáveis
│   ├── Header.jsx       # Cabeçalho com botão de acesso
│   ├── Hero.jsx         # Seção principal da landing page
│   ├── HowItWorks.jsx   # Seção "Como funciona"
│   ├── EvaluationCriteria.jsx
│   ├── Benefits.jsx     # Seção de benefícios
│   └── Footer.jsx       # Rodapé
├── pages/               # Páginas da aplicação
│   ├── Login.jsx        # Página de login administrativo
│   └── ForgotPassword.jsx # Página de recuperação de senha
├── styles/              # Arquivos CSS por componente
│   ├── Header.css
│   ├── Hero.css
│   ├── HowItWorks.css
│   ├── EvaluationCriteria.css
│   ├── Benefits.css
│   ├── Footer.css
│   └── Login.css        # Estilos do login e esqueceu senha
└── App.js               # Configuração de rotas
```

---

## 🔄 Fluxo da Aplicação

```
Landing Page (/)
      │
      │  clica em "Entrar" no Header
      ▼
  Login (/login)
      │
      ├── credenciais corretas ──► Painel Admin (/admin)
      │
      ├── credenciais erradas ──► exibe mensagem de erro
      │
      └── clica em "Esqueceu a senha?" ──► Recuperar Senha (/esqueceu-senha)
                                                    │
                                                    └── clica em "Enviar" ──► volta para Login (/)
```

### Detalhes de cada tela

**🏠 Landing Page `/`**
Página inicial com todas as seções institucionais do programa Impulso. O botão **Entrar** no cabeçalho redireciona para a tela de login.

**🔐 Login `/login`**
Tela de autenticação com:
- Validação de formato de e-mail
- Validação de senha com mínimo de 6 caracteres
- Exibição/ocultação de senha
- Mensagem de erro para credenciais incorretas
- Link para recuperação de senha
- Botão de registro

**📧 Esqueceu a Senha `/esqueceu-senha`**
Tela para recuperação de acesso. O usuário informa o e-mail acadêmico e ao clicar em **Enviar** é redirecionado de volta para a tela de login.

---

## ▶️ Como Rodar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/gaabrielvictor/landing-page-impulso.git

# 2. Entre na pasta do projeto
cd landing-page-impulso

# 3. Instale as dependências
npm install

# 4. Rode o projeto
npm start
```

Acesse em: `http://localhost:3000/landing-page-impulso`

---

## 🔑 Credenciais de Acesso

> ⚠️ Credenciais apenas para fins de demonstração. Em produção, substitua por autenticação via API.

| Campo | Valor |
|---|---|
| E-mail | `admin@unifacisa.com` |
| Senha | `admin123` |

---

## 👨‍💻 Autor

Desenvolvido por [Gabriel Victor](https://github.com/gaabrielvictor)