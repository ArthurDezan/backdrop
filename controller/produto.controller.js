const mysql = require("../config/mysql");

// -----------------------------------------------------
// GET /produtos/estabelecimento/:id
// Já existia — mantido exatamente igual
// -----------------------------------------------------
exports.getProdutosPorEstabelecimento = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "O ID do estabelecimento é obrigatório" });
    }

    const [rows] = await mysql.execute(
      `SELECT p.id, p.nome, p.preco, p.descricao, p.quantidade,
              p.categoria_id, c.nome AS categoria_nome
       FROM produtos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.estabelecimento_id = ?
       ORDER BY p.id DESC`,
      [id]
    );

    return res.status(200).json(rows || []);

  } catch (error) {
    console.error("Erro em getProdutosPorEstabelecimento:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

// -----------------------------------------------------
// POST /produtos
// Cadastra um novo produto para o estabelecimento logado
// Body: { nome, preco, descricao, quantidade, categoria_id }
// Header: Authorization Bearer <loja_token>
// -----------------------------------------------------
exports.cadastrarProduto = async (req, res) => {
  const { nome, preco, descricao, quantidade, categoria_id } = req.body;
  const estabelecimento_id = req.loja.id; // injetado pelo middleware authLoja

  if (!nome || !preco || !categoria_id) {
    return res.status(400).json({ error: "Nome, preço e categoria são obrigatórios" });
  }

  try {
    const [result] = await mysql.execute(
      `INSERT INTO produtos (nome, preco, descricao, quantidade, categoria_id, estabelecimento_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nome,
        parseFloat(preco),
        descricao || null,
        quantidade || 0,
        categoria_id,
        estabelecimento_id
      ]
    );

    return res.status(201).json({
      Mensagem: "Produto cadastrado com sucesso",
      Resultado: {
        id: result.insertId,
        nome, preco, descricao, quantidade, categoria_id, estabelecimento_id
      }
    });

  } catch (error) {
    console.error("Erro em cadastrarProduto:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

// -----------------------------------------------------
// PUT /produtos/:id
// Atualiza um produto do estabelecimento logado
// -----------------------------------------------------
exports.atualizarProduto = async (req, res) => {
  const { id } = req.params;
  const { nome, preco, descricao, quantidade, categoria_id } = req.body;
  const estabelecimento_id = req.loja.id;

  try {
    const [check] = await mysql.execute(
      'SELECT id FROM produtos WHERE id = ? AND estabelecimento_id = ?',
      [id, estabelecimento_id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado ou sem permissão" });
    }

    await mysql.execute(
      `UPDATE produtos SET nome = ?, preco = ?, descricao = ?, quantidade = ?, categoria_id = ?
       WHERE id = ? AND estabelecimento_id = ?`,
      [nome, parseFloat(preco), descricao || null, quantidade || 0, categoria_id, id, estabelecimento_id]
    );

    return res.status(200).json({ Mensagem: "Produto atualizado com sucesso" });

  } catch (error) {
    console.error("Erro em atualizarProduto:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

// -----------------------------------------------------
// DELETE /produtos/:id
// Remove um produto do estabelecimento logado
// -----------------------------------------------------
exports.deletarProduto = async (req, res) => {
  const { id } = req.params;
  const estabelecimento_id = req.loja.id;

  try {
    const [check] = await mysql.execute(
      'SELECT id FROM produtos WHERE id = ? AND estabelecimento_id = ?',
      [id, estabelecimento_id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado ou sem permissão" });
    }

    await mysql.execute(
      'DELETE FROM produtos WHERE id = ? AND estabelecimento_id = ?',
      [id, estabelecimento_id]
    );

    return res.status(200).json({ Mensagem: "Produto removido com sucesso" });

  } catch (error) {
    console.error("Erro em deletarProduto:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};