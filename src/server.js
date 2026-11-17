require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');

const { limiterGlobal, limiterLogin } = require('./middlewares/rateLimiter');
const validate = require('./middlewares/validateMiddleware');
const authMiddleware = require('./middlewares/authMiddleware');
const permitirPerfis = require('./middlewares/roleMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const {
  registroSchema,
  loginSchema,
  refreshSchema,
  tarefaSchema,
  atualizarTarefaSchema
} = require('./schemas/apiSchemas');

const authController = require('./controllers/authController');
const recursoController = require('./controllers/recursoController');

const app = express();

// Camadas globais de Hardening
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  })
);
app.use(limiterGlobal);
app.use(express.json({ limit: '10kb' }));
app.use(hpp());

// Rota pública de verificação de saúde
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', servico: 'API Segura' });
});

// Rotas de Autenticação
app.post('/api/auth/registrar', validate(registroSchema), authController.registrar);
app.post('/api/auth/login', limiterLogin, validate(loginSchema), authController.login);
app.post('/api/auth/refresh', validate(refreshSchema), authController.refresh);
app.post('/api/auth/logout', authMiddleware, authController.logout);

// Rotas de Recursos (Protegidas por JWT + Validação de Propriedade BOLA/IDOR)
app.post('/api/tarefas', authMiddleware, validate(tarefaSchema), recursoController.criarTarefa);
app.get('/api/tarefas', authMiddleware, recursoController.listarMinhasTarefas);
app.patch(
  '/api/tarefas/:id',
  authMiddleware,
  validate(atualizarTarefaSchema),
  recursoController.atualizarTarefa
);
app.delete('/api/tarefas/:id', authMiddleware, recursoController.deletarTarefa);

// Rotas Administrativas (Protegidas por JWT + RBAC ADMIN)
app.get(
  '/api/admin/usuarios',
  authMiddleware,
  permitirPerfis('ADMIN'),
  recursoController.listarTodosUsuarios
);

app.get(
  '/api/admin/auditoria',
  authMiddleware,
  permitirPerfis('ADMIN'),
  recursoController.listarLogsAuditoria
);

// Tratamento Global de Erros (sem vazamento de stack trace)
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Segura rodando na porta ${PORT}`);
});
