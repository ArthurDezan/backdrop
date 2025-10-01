const mysql = require("../config/mysql");

// Buscar produtos por ID do estabelecimento
exports.getProdutosPorEstabelecimento = async (req, res) => {
  try {
    const { id } = req.params; // Pega o ID da URL

    if (!id) {
      return res.status(400).json({ error: "O ID do estabelecimento é obrigatório" });
    }

    const [rows] = await mysql.execute(
      'SELECT * FROM produtos WHERE estabelecimento_id = ?',
      [id]
    );

    if (!rows || rows.length === 0) {
      // Retorna uma lista vazia se não encontrar produtos, o que não é um erro
      return res.status(200).json([]);
    }

    return res.status(200).json(rows);

  } catch (error) {
    console.error("Erro em getProdutosPorEstabelecimento:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};