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

// Função para buscar um estabelecimento por ID
exports.getEstabelecimentoById = async (req, res) => {
  try {
    const { id } = req.params; // Pega o ID da URL, ex: o "1" de "/estabelecimentos/1"

    if (!id) {
      return res.status(400).json({ error: "O ID do estabelecimento é obrigatório." });
    }

    const [rows] = await db.query('SELECT * FROM estabelecimentos WHERE id = ?', [id]);

    // Verifica se encontrou algum resultado
    if (rows.length === 0) {
      return res.status(404).json({ error: "Estabelecimento não encontrado." });
    }

    // Retorna o primeiro (e único) resultado
    res.json(rows[0]);

  } catch (err) {
    console.error('Erro ao executar query:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};
