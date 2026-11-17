const rateLimit = require('express-rate-limit');

const limiterGlobal = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { erro: 'Muitas requisições deste IP. Tente novamente mais tarde.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { erro: 'Muitas tentativas de login falhas. IP bloqueado por 15 minutos.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

module.exports = { limiterGlobal, limiterLogin };
