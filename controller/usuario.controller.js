require('dotenv').config();
const mysql = require("../config/mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ✅ Transporter de email (mesmo padrão do auth.controller)
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ NOVA ROTA: Envia código de verificação para o email antes do cadastro
exports.enviarCodigoCadastro = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }

  try {
    const conn = await mysql.getConnection();

    // Verifica se o email já está cadastrado
    const [existente] = await conn.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existente.length > 0) {
      conn.release();
      return res.status(400).json({ error: 'Este email já está cadastrado.' });
    }

    const codigo = gerarCodigo();
    const expiracao = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Salva o código na tabela de recuperação (reutilizamos a mesma tabela)
    await conn.execute(
      `INSERT INTO recuperacao_senha (email, codigo, expiracao, usado)
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE codigo = ?, expiracao = ?, usado = 0`,
      [email, codigo, expiracao, codigo, expiracao]
    );

    conn.release();

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Drop App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de Verificação - Drop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #A86F4C; text-align: center;">✉️ Verificação de Email</h2>
          <p style="color: #555; text-align: center;">Use o código abaixo para confirmar seu cadastro. Ele expira em <strong>15 minutos</strong>.</p>
          <div style="background: #A86F4C; color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px; text-align: center; padding: 20px; border-radius: 10px; margin: 24px 0;">
            ${codigo}
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">Se você não solicitou isso, ignore este email.</p>
        </div>
      `,
    });

    res.status(200).json({ message: 'Código enviado para o seu email!' });

  } catch (error) {
    console.error('=== ERRO ENVIAR CODIGO CADASTRO ===');
    console.error('Mensagem:', error.message);
    res.status(500).json({ error: 'Erro ao enviar o código. Tente novamente.' });
  }
};

exports.loginUsuario = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const [rows] = await mysql.execute(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ Mensagem: "Usuário não encontrado" });
    }

    const usuario = rows[0];

    const match = await bcrypt.compare(senha, usuario.senha);
    if (!match) {
      return res.status(401).json({ Mensagem: "Senha incorreta" });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        email: usuario.email,
        admin: usuario.admin || 0
      },
      "senhafojwt",
      { expiresIn: '1h' }
    );

    const { senha: _, ...dadosUsuario } = usuario;

    return res.status(200).json({
      Mensagem: "Usuario logado com sucesso",
      Resultado: dadosUsuario,
      token
    });

  } catch (error) {
    console.error("Erro no loginUsuario:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

// ✅ ATUALIZADO: Valida o código antes de salvar o usuário
exports.cadastrarUsuario = async (req, res) => {
  try {
    const { nome, sobrenome, email, senha, endereco, numero_endereco, codigo } = req.body;

    if (!nome || !sobrenome || !email || !senha) {
      return res.status(400).json({
        error: "Nome, sobrenome, email e senha são obrigatórios"
      });
    }

    if (!codigo) {
      return res.status(400).json({ error: "Código de verificação é obrigatório." });
    }

    const conn = await mysql.getConnection();

    // Valida o código
    const [registros] = await conn.execute(
      `SELECT * FROM recuperacao_senha 
       WHERE email = ? AND codigo = ? AND usado = 0 AND expiracao > NOW()`,
      [email, codigo]
    );

    if (registros.length === 0) {
      conn.release();
      return res.status(400).json({ error: 'Código inválido ou expirado.' });
    }

    // Marca o código como usado
    await conn.execute(
      'UPDATE recuperacao_senha SET usado = 1 WHERE email = ?',
      [email]
    );

    conn.release();

    // Salva o usuário normalmente
    const hash = await bcrypt.hash(senha, 10);
    const resultado = await mysql.execute(
      `INSERT INTO usuarios (nome, sobrenome, email, senha, endereco, numero_endereco)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, sobrenome, email, hash, endereco, numero_endereco]
    );

    return res.status(201).json({
      Mensagem: "Usuario criado com sucesso",
      Resultado: resultado
    });

  } catch (error) {
    console.error("Erro no cadastrarUsuario:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.atualizarUsuario = async (req, res) => {
  try {
    const resultado = await mysql.execute(
      `UPDATE usuarios 
       SET nome = ?, sobrenome = ?, email = ?, endereco = ?, numero_endereco = ?
       WHERE id = ?`,
      [
        req.body.nome,
        req.body.sobrenome,
        req.body.email,
        req.body.endereco,
        req.body.numero,
        res.locals.idUsuario
      ]
    );

    return res.status(200).json({
      Mensagem: "Usuario atualizado com sucesso",
      Resultado: resultado
    });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

exports.getUsuarioLogado = async (req, res) => {
  try {
    const idUsuario = res.locals.idUsuario;

    if (!idUsuario) {
      return res.status(401).json({ error: "Usuário não autenticado via token." });
    }

    const [rows] = await mysql.execute(
      'SELECT * FROM usuarios WHERE id = ?',
      [idUsuario]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const usuario = rows[0];
    const { senha: _, ...dadosUsuario } = usuario;

    return res.status(200).json(dadosUsuario);

  } catch (error) {
    console.error("Erro em getUsuarioLogado:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};