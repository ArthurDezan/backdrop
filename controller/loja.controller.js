// controllers/loja.controller.js

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../config/mysql'); // mysql2 já com promise nativa

const JWT_SECRET = process.env.JWT_SECRET || 'drop_secret_key';

// -----------------------------------------------------
// POST /lojas/cadastrar
// -----------------------------------------------------
exports.cadastrar = async (req, res) => {
  const {
    nome, cnpj, email, senha,
    categoria_id, localizacao, numero_endereco,
    bairro, cidade, tempo_de_espera
  } = req.body;

  if (!nome || !cnpj || !email || !senha || !categoria_id || !localizacao || !numero_endereco) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM estabelecimentos WHERE cnpj = ? OR email = ?',
      [cnpj, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ erro: 'CNPJ ou e-mail já cadastrado' });
    }

    const hash = await bcrypt.hash(senha, 10);

    const [result] = await db.query(
      `INSERT INTO estabelecimentos
         (nome, cnpj, email, senha, categoria_id,
          localizacao, numero_endereco, bairro, cidade, tempo_de_espera)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome, cnpj, email, hash, categoria_id,
        localizacao, numero_endereco,
        bairro  || null,
        cidade  || null,
        tempo_de_espera || 30
      ]
    );

    const token = jwt.sign(
      { id: result.insertId, tipo: 'loja' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      Mensagem: 'Loja cadastrada com sucesso',
      Resultado: {
        id:              result.insertId,
        nome, email, cnpj, categoria_id,
        localizacao, numero_endereco,
        bairro:          bairro  || null,
        cidade:          cidade  || null,
        tempo_de_espera: tempo_de_espera || 30,
        logo_url:        null,
        banner_url:      null,
        ativo:           1
      },
      token
    });

  } catch (err) {
    console.error('Erro ao cadastrar loja:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// -----------------------------------------------------
// POST /lojas/login
// -----------------------------------------------------
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  try {
    const [rows] = await db.query(
      `SELECT e.id, e.nome, e.email, e.senha, e.cnpj,
              e.localizacao, e.numero_endereco, e.bairro, e.cidade,
              e.categoria_id, e.logo_url, e.banner_url,
              e.tempo_de_espera, e.ativo
       FROM estabelecimentos e
       WHERE e.email = ? AND e.senha IS NOT NULL`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    const loja = rows[0];

    if (!loja.ativo) {
      return res.status(403).json({ erro: 'Loja desativada. Entre em contato com o suporte.' });
    }

    const senhaOk = await bcrypt.compare(senha, loja.senha);
    if (!senhaOk) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: loja.id, tipo: 'loja' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { senha: _, ...lojaPublica } = loja;

    return res.status(200).json({
      Mensagem: 'Login realizado com sucesso',
      Resultado: lojaPublica,
      token
    });

  } catch (err) {
    console.error('Erro no login da loja:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// -----------------------------------------------------
// GET /lojas/me
// -----------------------------------------------------
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nome, email, cnpj, localizacao, numero_endereco,
              bairro, cidade, categoria_id, logo_url, banner_url,
              tempo_de_espera, ativo, criado_em
       FROM estabelecimentos
       WHERE id = ? AND senha IS NOT NULL`,
      [req.loja.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    return res.status(200).json(rows[0]);

  } catch (err) {
    console.error('Erro ao buscar loja:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// -----------------------------------------------------
// GET /lojas
// -----------------------------------------------------
exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.nome, e.localizacao, e.numero_endereco,
              e.bairro, e.cidade, e.tempo_de_espera,
              e.logo_url, e.banner_url, e.latitude, e.longitude,
              e.categoria_id, c.nome AS categoria_nome,
              e.criado_em
       FROM estabelecimentos e
       LEFT JOIN categorias c ON c.id = e.categoria_id
       WHERE e.ativo = 1
       ORDER BY e.criado_em DESC`
    );

    return res.status(200).json({ lojas: rows });

  } catch (err) {
    console.error('Erro ao listar lojas:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// -----------------------------------------------------
// PUT /lojas/:id
// -----------------------------------------------------
exports.atualizarPerfil = async (req, res) => {
  const { nome, localizacao, numero_endereco, bairro, cidade } = req.body;
  const id = req.loja.id;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }

  try {
    await db.query(
      `UPDATE estabelecimentos
       SET nome = ?, localizacao = ?, numero_endereco = ?, bairro = ?, cidade = ?
       WHERE id = ?`,
      [
        nome.trim(),
        localizacao     || null,
        numero_endereco || null,
        bairro          || null,
        cidade          || null,
        id
      ]
    );

    const [rows] = await db.query(
      `SELECT id, nome, email, cnpj, localizacao, numero_endereco,
              bairro, cidade, categoria_id, logo_url, banner_url, tempo_de_espera
       FROM estabelecimentos WHERE id = ?`,
      [id]
    );

    return res.status(200).json({
      Mensagem: 'Perfil atualizado com sucesso',
      Resultado: rows[0]
    });

  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};