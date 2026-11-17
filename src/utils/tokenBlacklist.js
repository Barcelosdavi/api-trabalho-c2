const tokensRevogados = new Set();

module.exports = {
  revogarToken: (jti) => {
    if (jti) tokensRevogados.add(jti);
  },
  estaRevogado: (jti) => {
    return jti ? tokensRevogados.has(jti) : false;
  }
};
