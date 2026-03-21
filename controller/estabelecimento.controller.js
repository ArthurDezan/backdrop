const db = require('../config/mysql');

exports.getAllEstabelecimentos = async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT id, nome, localizacao, tempo_de_espera,
              logo_url, banner_url, categoria_id,
              latitude, longitude, mapa_url
       FROM estabelecimentos
       WHERE ativo = 1
       ORDER BY id ASC`
    );
    res.json(results);
  } catch (err) {
    console.error('Erro ao executar query:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

exports.getEstabelecimentoById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'O ID do estabelecimento é obrigatório.' });
    }

    const [rows] = await db.query(
      `SELECT id, nome, localizacao, tempo_de_espera,
              logo_url, banner_url, categoria_id,
              latitude, longitude, mapa_url
       FROM estabelecimentos
       WHERE id = ? AND ativo = 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado.' });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error('Erro ao executar query:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};