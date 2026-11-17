module.exports = (schema) => {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      const detalhes = resultado.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensagem: issue.message
      }));

      return res.status(400).json({
        erro: 'Dados de entrada inválidos.',
        detalhes
      });
    }

    req.body = resultado.data;
    next();
  };
};
