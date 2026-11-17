const prisma = require('./prisma');

exports.registrarAuditoria = async (req, evento, detalhes, usuarioId = null) => {
  try {
    await prisma.logAuditoria.create({
      data: {
        evento,
        usuarioId: usuarioId || req.usuario?.id || null,
        ip: req.ip || req.socket?.remoteAddress || 'desconhecido',
        detalhes
      }
    });
  } catch (err) {
    console.error('[FALHA AUDITORIA]:', err.message);
  }
};
