const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { revogarToken } = require('../utils/tokenBlacklist');
const { registrarAuditoria } = require('../utils/auditoria');

const gerarParTokens = (usuario) => {
  const jti = crypto.randomUUID();

  const accessToken = jwt.sign(
    { id: usuario.id, role: usuario.role, jti },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: usuario.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

exports.registrar = async (req, res, next) => {
  try {
    const { nome, email, senha, codigoAdmin } = req.body;

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    const salt = await bcrypt.genSalt(12);
    const senhaHash = await bcrypt.hash(senha, salt);

    const roleDefinida =
      codigoAdmin && codigoAdmin === process.env.ADMIN_SECRET ? 'ADMIN' : 'USER';

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        role: roleDefinida
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        criadoEm: true
      }
    });

    await registrarAuditoria(
      req,
      'USUARIO_REGISTRADO',
      `Novo usuário criado (${email}) com perfil ${roleDefinida}`,
      novoUsuario.id
    );

    return res.status(201).json({
      mensagem: 'Usuário registrado com sucesso!',
      usuario: novoUsuario
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      await registrarAuditoria(req, 'LOGIN_FALHOU', `E-mail não encontrado: ${email}`);
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      await registrarAuditoria(
        req,
        'LOGIN_FALHOU',
        `Senha incorreta para o usuário: ${email}`,
        usuario.id
      );
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const { accessToken, refreshToken } = gerarParTokens(usuario);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { refreshToken }
    });

    await registrarAuditoria(req, 'LOGIN_SUCESSO', `Autenticação realizada: ${email}`, usuario.id);

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      accessToken,
      refreshToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        role: usuario.role
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    let decodificado;
    try {
      decodificado = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ erro: 'Refresh token inválido ou expirado.' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: decodificado.id }
    });

    if (!usuario || usuario.refreshToken !== refreshToken) {
      await registrarAuditoria(
        req,
        'REFRESH_TOKEN_REJEITADO',
        'Tentativa de uso de refresh token revogado ou já rotacionado',
        decodificado.id
      );
      return res.status(401).json({ erro: 'Sessão revogada. Faça login novamente.' });
    }

    // Rotação de Refresh Token: invalida o anterior e emite um novo par
    const novosTokens = gerarParTokens(usuario);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { refreshToken: novosTokens.refreshToken }
    });

    return res.status(200).json({
      accessToken: novosTokens.accessToken,
      refreshToken: novosTokens.refreshToken
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    revogarToken(req.usuario.jti);

    await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { refreshToken: null }
    });

    await registrarAuditoria(req, 'LOGOUT_REVOGACAO', 'Sessão encerrada e token revogado');

    return res.status(200).json({
      mensagem: 'Logout realizado. Access token e refresh token revogados imediatamente.'
    });
  } catch (error) {
    next(error);
  }
};
