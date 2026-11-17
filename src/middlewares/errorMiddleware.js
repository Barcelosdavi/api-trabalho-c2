module.exports = (err, req, res, next) => {
  console.error('[ERRO INTERNO]:', err.message);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Payload muito grande. Limite máximo de 10KB.' });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ erro: 'JSON malformado no corpo da requisição.' });
  }

  return res.status(500).json({
    erro: 'Erro interno no servidor. Tente novamente mais tarde.'
  });
};
