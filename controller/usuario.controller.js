require('dotenv').config();
const mysql = require("../config/mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Configuração do disparador de emails
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Geração de código de 6 dígitos
function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// FUNÇÃO AUXILIAR DE SEGURANÇA (Previne o Erro 500 de parâmetro undefined)
function obterIdUsuarioSeguro(req, res) {
  const id = res.locals.idUsuario || req.idUsuario || (req.usuario ? req.usuario.idUsuario || req.usuario.id : null);
  if (!id) {
    console.error("🚨 [ERRO CRÍTICO] idUsuario não foi encontrado na requisição! Verifique o seu middleware de autenticação.");
  }
  return id;
}

exports.enviarCodigoCadastro = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório.' });

  try {
    const conn = await mysql.getConnection();
    const [existente] = await conn.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
    
    if (existente.length > 0) {
      conn.release();
      return res.status(400).json({ error: 'Este email já está cadastrado.' });
    }
    
    const codigo = gerarCodigo();
    const expiracao = new Date(Date.now() + 15 * 60 * 1000);
    
    await conn.execute('INSERT INTO recuperacao_senha (email, codigo, expiracao) VALUES (?, ?, ?)', [email, codigo, expiracao]);
    conn.release();
    
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Drop Delivery" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de Verificação - Cadastro',
      text: `Seu código de verificação é: ${codigo}`,
      html: `<b>Seu código de verificação é: ${codigo}</b>`,
    });
    
    return res.status(200).json({ message: 'Código enviado com sucesso!' });
  } catch (error) {
    console.error("Erro no enviarCodigoCadastro:", error);
    return res.status(500).json({ error: "Erro interno: " + error.message });
  }
};

exports.cadastrarUsuario = async (req, res) => {
  const { nome, email, senha, codigo } = req.body;
  if (!nome || !email || !senha || !codigo) return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });

  try {
    const conn = await mysql.getConnection();
    const [rows] = await conn.execute('SELECT * FROM recuperacao_senha WHERE email = ? AND codigo = ? AND usado = 0 AND expiracao > NOW()', [email, codigo]);
    
    if (rows.length === 0) {
      conn.release();
      return res.status(400).json({ error: 'Código inválido ou expirado.' });
    }
    
    await conn.execute('UPDATE recuperacao_senha SET usado = 1 WHERE id = ?', [rows[0].id]);
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await conn.execute('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hash]);
    conn.release();
    
    return res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: result.insertId });
  } catch (error) {
    console.error("Erro no cadastrarUsuario:", error);
    return res.status(500).json({ error: "Erro interno: " + error.message });
  }
};

exports.loginUsuario = async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: "Email e senha são obrigatórios." });

  try {
    const [rows] = await mysql.execute("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ error: "Credenciais inválidas." });
    
    const usuario = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) return res.status(401).json({ error: "Credenciais inválidas." });
    
    const token = jwt.sign(
      { idUsuario: usuario.id, email: usuario.email }, 
      process.env.JWT_KEY, 
      { expiresIn: "7d" }
    );
    
    delete usuario.senha;
    return res.status(200).json({ Mensagem: "Login efetuado com sucesso", Resultado: usuario, token: token });
  } catch (error) {
    console.error("Erro no loginUsuario:", error);
    return res.status(500).json({ error: "Erro interno: " + error.message });
  }
};

exports.getUsuarioLogado = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    if (!idUsuario) return res.status(401).json({ error: "Usuário não identificado na sessão." });
    
    const [rows] = await mysql.execute(
      'SELECT id, nome, sobrenome, email, endereco, numero_endereco, telefone, cpf, data_nascimento, foto_perfil FROM usuarios WHERE id = ?', 
      [idUsuario]
    );
    
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado no banco." });
    return res.status(200).json({ Resultado: rows[0] });
  } catch (error) {
    console.error("🚨 Erro no getUsuarioLogado:", error);
    return res.status(500).json({ error: "Erro no banco de dados: " + error.message });
  }
};

exports.atualizarUsuario = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    if (!idUsuario) return res.status(401).json({ error: "Usuário não identificado." });
    
    const resultado = await mysql.execute(
      `UPDATE usuarios 
       SET nome = ?, sobrenome = COALESCE(?, sobrenome), email = ?, 
           endereco = COALESCE(?, endereco), numero_endereco = COALESCE(?, numero_endereco), 
           telefone = ?, cpf = ?, data_nascimento = ? WHERE id = ?`,
      [req.body.nome, req.body.sobrenome || null, req.body.email, req.body.endereco || null, req.body.numero_endereco || null, req.body.telefone || null, req.body.cpf || null, req.body.data_nascimento || null, idUsuario]
    );
    return res.status(200).json({ Mensagem: "Usuário atualizado com sucesso!", Resultado: resultado });
  } catch (error) {
    console.error("🚨 Erro no atualizarUsuario:", error);
    return res.status(500).json({ error: "Erro ao atualizar: " + error.message });
  }
};

exports.atualizarFoto = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    const { foto } = req.body;
    await mysql.execute('UPDATE usuarios SET foto_perfil = ? WHERE id = ?', [foto, idUsuario]);
    return res.status(200).json({ message: "Foto de perfil atualizada com sucesso!" });
  } catch (error) {
    console.error("🚨 Erro no atualizarFoto:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.listarEnderecos = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    if (!idUsuario) return res.status(401).json({ error: "Usuário não identificado." });

    const [rows] = await mysql.execute('SELECT * FROM enderecos_usuario WHERE usuario_id = ?', [idUsuario]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("🚨 Erro no listarEnderecos (Verifique se a tabela 'enderecos_usuario' existe):", error);
    return res.status(500).json({ error: "Erro ao listar endereços: " + error.message });
  }
};

exports.adicionarEndereco = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    const { titulo, endereco, numero, bairro, city, complemento } = req.body;
    
    const [result] = await mysql.execute(
      'INSERT INTO enderecos_usuario (usuario_id, titulo, endereco, numero, bairro, cidade, complemento) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [idUsuario, titulo, endereco, numero, bairro || null, city || null, complemento || null]
    );
    return res.status(201).json({ message: "Endereço adicionado com sucesso!", id: result.insertId });
  } catch (error) {
    console.error("🚨 Erro no adicionarEndereco:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deletarEndereco = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    await mysql.execute('DELETE FROM enderecos_usuario WHERE id = ? AND usuario_id = ?', [req.params.id, idUsuario]);
    return res.status(200).json({ message: "Endereço removido com sucesso!" });
  } catch (error) {
    console.error("🚨 Erro no deletarEndereco:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.listarCartoes = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    if (!idUsuario) return res.status(401).json({ error: "Usuário não identificado." });

    const [rows] = await mysql.execute('SELECT id, titular, numero_cartao, validade, bandeira, padrao FROM cartoes_usuario WHERE usuario_id = ?', [idUsuario]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("🚨 Erro no listarCartoes (Verifique se a tabela 'cartoes_usuario' existe):", error);
    return res.status(500).json({ error: "Erro ao listar cartões: " + error.message });
  }
};

exports.adicionarCartao = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    const { titular, numero_cartao, validade, cvv, bandeira } = req.body;
    
    const [result] = await mysql.execute(
      'INSERT INTO cartoes_usuario (usuario_id, titular, numero_cartao, validade, cvv, bandeira) VALUES (?, ?, ?, ?, ?, ?)',
      [idUsuario, titular, numero_cartao, validade, cvv, bandeira]
    );
    return res.status(201).json({ message: "Cartão adicionado com sucesso!", id: result.insertId });
  } catch (error) {
    console.error("🚨 Erro no adicionarCartao:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deletarCartao = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    await mysql.execute('DELETE FROM cartoes_usuario WHERE id = ? AND usuario_id = ?', [req.params.id, idUsuario]);
    return res.status(200).json({ message: "Cartão removido com sucesso!" });
  } catch (error) {
    console.error("🚨 Erro no deletarCartao:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.definirCartaoPadrao = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    await mysql.execute('UPDATE cartoes_usuario SET padrao = 0 WHERE usuario_id = ?', [idUsuario]);
    await mysql.execute('UPDATE cartoes_usuario SET padrao = 1 WHERE id = ? AND usuario_id = ?', [req.params.id, idUsuario]);
    return res.status(200).json({ message: "Cartão definido como padrão!" });
  } catch (error) {
    console.error("🚨 Erro no definirCartaoPadrao:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.obterConfiguracoes = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    if (!idUsuario) return res.status(401).json({ error: "Usuário não identificado." });

    const [rows] = await mysql.execute('SELECT notificacoes, emails, modo_escuro FROM configuracoes_usuario WHERE usuario_id = ?', [idUsuario]);
    if (rows.length === 0) {
      return res.status(200).json({ notificacoes: 1, emails: 1, modo_escuro: 0 });
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("🚨 Erro no obterConfiguracoes:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.salvarConfiguracoes = async (req, res) => {
  try {
    const idUsuario = obterIdUsuarioSeguro(req, res);
    const { notificacoes, emails, modo_escuro } = req.body;
    
    await mysql.execute(
      `INSERT INTO configuracoes_usuario (usuario_id, notificacoes, emails, modo_escuro) 
       VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE 
       notificacoes = VALUES(notificacoes), emails = VALUES(emails), modo_escuro = VALUES(modo_escuro)`,
      [idUsuario, notificacoes ? 1 : 0, emails ? 1 : 0, modo_escuro ? 1 : 0]
    );
    return res.status(200).json({ message: "Configurações atualizadas com sucesso!" });
  } catch (error) {
    console.error("🚨 Erro no salvarConfiguracoes:", error);
    return res.status(500).json({ error: error.message });
  }
};