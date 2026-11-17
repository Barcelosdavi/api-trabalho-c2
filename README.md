# API Segura — Trabalho C2 

API RESTful em **Node.js** e **Express** com foco em autenticação, controle de acesso granular, rastreabilidade de eventos e mitigação das principais falhas do **OWASP API Security Top 10**.

## Stack e Segurança

- **Core:** Node.js, Express, SQLite e Prisma ORM v6
- **Autenticação:** JWT (`Access Token` de 15m + `Refresh Token` de 7d com rotação e blacklist imediata via `jti`)
- **Autorização:** RBAC (`USER` / `ADMIN`) e proteção contra **BOLA/IDOR** nas rotas de recursos
- **Hardening:** `bcryptjs` (salt 12), `Zod` (validação estrita), `Helmet`, `CORS`, `hpp`, limite de payload (`10kb`), `express-rate-limit` e **Trilha de Auditoria** (`LogAuditoria`)

## Como Executar

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env` e configure os segredos
3. Sincronize o banco SQLite: `npx prisma db push && npx prisma generate`
4. Inicie a API: `npm start`

## Endpoints Principais

| Método | Rota | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Público | Verifica status da API |
| `POST` | `/api/auth/registrar` | Público | Cria usuário (`USER` ou `ADMIN` via `codigoAdmin`) |
| `POST` | `/api/auth/login` | Público (Rate Limited) | Autentica e gera `accessToken` e `refreshToken` |
| `POST` | `/api/auth/refresh` | Público | Rotaciona o `refreshToken` e emite novo `accessToken` |
| `POST` | `/api/auth/logout` | Autenticado | Revoga o `jti` do `accessToken` e invalida a sessão |
| `POST` | `/api/tarefas` | Autenticado | Cria tarefa vinculada ao usuário autenticado |
| `GET` | `/api/tarefas` | Autenticado | Lista apenas as tarefas do próprio usuário |
| `PATCH` | `/api/tarefas/:id` | Dono / `ADMIN` | Atualiza tarefa com proteção BOLA/IDOR |
| `DELETE` | `/api/tarefas/:id` | Dono / `ADMIN` | Remove tarefa com proteção BOLA/IDOR |
| `GET` | `/api/admin/usuarios` | `ADMIN` | Lista usuários sem expor hashes de senha |
| `GET` | `/api/admin/auditoria` | `ADMIN` | Lista os últimos 50 eventos de segurança |
