const db = require('../config/mysql');

exports.getAllEstabelecimentos = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM estabelecimentos');
    res.json(results);
  } catch (err) {
    console.error('Erro ao executar query:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};
