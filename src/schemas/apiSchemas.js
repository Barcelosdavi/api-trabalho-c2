const { z } = require('zod');

const registroSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Formato de e-mail inválido.'),
  senha: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres.')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número.'),
  codigoAdmin: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Formato de e-mail inválido.'),
  senha: z.string().min(1, 'A senha é obrigatória.')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token inválido.')
});

const tarefaSchema = z.object({
  titulo: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  descricao: z.string().max(300, 'A descrição pode ter no máximo 300 caracteres.').optional()
});

const atualizarTarefaSchema = z.object({
  titulo: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.').optional(),
  descricao: z.string().max(300, 'A descrição pode ter no máximo 300 caracteres.').optional(),
  concluida: z.boolean().optional()
});

module.exports = {
  registroSchema,
  loginSchema,
  refreshSchema,
  tarefaSchema,
  atualizarTarefaSchema
};
