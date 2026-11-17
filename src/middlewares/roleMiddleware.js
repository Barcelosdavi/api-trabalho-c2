const { registrarAuditoria } = require('../utils/auditoria');

module.exports = (...perfisPermitidos) => {
  return async (req, res, next) => {
    if (!req.usuario || !perfisPermitidos.includes(req.usuario.role)) {
      await registrarAuditoria(
        req,
        'ACESSO_NEGADO_RBAC',
        `Tentativa de acesso não autorizado à rota ${req.originalUrl} com perfil ${req.usuario?.role}`
      );

      return res.status(403).json({
        erro: 'Acesso proibido: privilégios insuficientes para esta operação.'
      });
    }
    next();
  };
};
