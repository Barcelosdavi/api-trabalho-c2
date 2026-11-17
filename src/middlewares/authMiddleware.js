const jwt = require('jsonwebtoken');
const { estaRevogado } = require('../utils/tokenBlacklist');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }

  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ erro: 'Formato de token inválido. Use: Bearer <token>' });
  }

  const token = partes[1];

  try {
    const decodificado = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (estaRevogado(decodificado.jti)) {
      return res.status(401).json({ erro: 'Sessão encerrada. Este token foi revogado.' });
    }

    req.usuario = {
      id: decodificado.id,
      role: decodificado.role,
      jti: decodificado.jti
    };
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};
