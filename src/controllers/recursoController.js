const prisma = require('../utils/prisma');
const { registrarAuditoria } = require('../utils/auditoria');

exports.criarTarefa = async (req, res, next) => {
  try {
    const { titulo, descricao } = req.body;

    const tarefa = await prisma.tarefa.create({
      data: {
        titulo,
        descricao,
        usuarioId: req.usuario.id
      }
    });

    return res.status(201).json(tarefa);
  } catch (error) {
    next(error);
  }
};

exports.listarMinhasTarefas = async (req, res, next) => {
  try {
    const tarefas = await prisma.tarefa.findMany({
      where: { usuarioId: req.usuario.id },
      orderBy: { criadoEm: 'desc' }
    });

    return res.status(200).json(tarefas);
  } catch (error) {
    next(error);
  }
};

exports.atualizarTarefa = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido.' });
    }

    const tarefa = await prisma.tarefa.findUnique({ where: { id } });
    if (!tarefa) {
      return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    }

    // Proteção BOLA / IDOR
    if (tarefa.usuarioId !== req.usuario.id && req.usuario.role !== 'ADMIN') {
      await registrarAuditoria(
        req,
        'TENTATIVA_BOLA_IDOR',
        `Usuário ${req.usuario.id} tentou editar tarefa ${id} pertencente ao usuário ${tarefa.usuarioId}`
      );
      return res.status(403).json({
        erro: 'Acesso negado: você não é o proprietário deste recurso.'
      });
    }

    const tarefaAtualizada = await prisma.tarefa.update({
      where: { id },
      data: req.body
    });

    return res.status(200).json(tarefaAtualizada);
  } catch (error) {
    next(error);
  }
};

exports.deletarTarefa = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido.' });
    }

    const tarefa = await prisma.tarefa.findUnique({ where: { id } });
    if (!tarefa) {
      return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    }

    // Proteção BOLA / IDOR
    if (tarefa.usuarioId !== req.usuario.id && req.usuario.role !== 'ADMIN') {
      await registrarAuditoria(
        req,
        'TENTATIVA_BOLA_IDOR',
        `Usuário ${req.usuario.id} tentou excluir tarefa ${id} pertencente ao usuário ${tarefa.usuarioId}`
      );
      return res.status(403).json({
        erro: 'Acesso negado: você não é o proprietário deste recurso.'
      });
    }

    await prisma.tarefa.delete({ where: { id } });
    return res.status(200).json({ mensagem: 'Tarefa removida com sucesso.' });
  } catch (error) {
    next(error);
  }
};

exports.listarTodosUsuarios = async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        criadoEm: true
      }
    });

    return res.status(200).json(usuarios);
  } catch (error) {
    next(error);
  }
};

exports.listarLogsAuditoria = async (req, res, next) => {
  try {
    const logs = await prisma.logAuditoria.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 50
    });

    return res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};
