// controller/auth.controller.js
require('dotenv').config(); // ✅ CORRIGIDO: carrega o .env antes de tudo

const mysql = require('../config/mysql');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// ✅ CORRIGIDO: transporter criado dentro de uma função
// para garantir que o .env já foi carregado quando for usado
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Gera um código numérico de 6 dígitos
function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. SOLICITAR CÓDIGO DE RECUPERAÇÃO
exports.solicitarRecuperacao = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }

  try {
    const conn = await mysql.getConnection();

    // Verifica se o email existe na base
    const [usuarios] = await conn.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (usuarios.length === 0) {
      conn.release();
      // Resposta genérica por segurança (não revela se o email existe)
      return res.status(200).json({ message: 'Se o email existir, você receberá um código.' });
    }

    const codigo = gerarCodigo();
    const expiracao = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Salva o código na tabela de recuperação
    await conn.execute(
      `INSERT INTO recuperacao_senha (email, codigo, expiracao, usado)
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE codigo = ?, expiracao = ?, usado = 0`,
      [email, codigo, expiracao, codigo, expiracao]
    );

    conn.release();

    // ✅ Usa a função para criar o transporter com as vars já carregadas
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"Drop App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de Recuperação de Senha - Drop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #A86F4C; text-align: center;">🔐 Recuperação de Senha</h2>
          <p style="color: #555; text-align: center;">Use o código abaixo para redefinir sua senha. Ele expira em <strong>15 minutos</strong>.</p>
          <div style="background: #A86F4C; color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px; text-align: center; padding: 20px; border-radius: 10px; margin: 24px 0;">
            ${codigo}
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">Se você não solicitou isso, ignore este email.</p>
        </div>
      `,
    });

    res.status(200).json({ message: 'Código enviado para o seu email!' });

  } catch (error) {
    console.error('=== ERRO SOLICITAR RECUPERACAO ===');
    console.error('Mensagem:', error.message);
    res.status(500).json({ error: 'Erro ao enviar o código. Tente novamente.' });
  }
};

// 2. VERIFICAR CÓDIGO E REDEFINIR SENHA
exports.redefinirSenha = async (req, res) => {
  const { email, codigo, novaSenha } = req.body;

  if (!email || !codigo || !novaSenha) {
    return res.status(400).json({ error: 'Email, código e nova senha são obrigatórios.' });
  }

  if (novaSenha.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const conn = await mysql.getConnection();

    // Busca o código válido, não expirado e não usado
    const [registros] = await conn.execute(
      `SELECT * FROM recuperacao_senha 
       WHERE email = ? AND codigo = ? AND usado = 0 AND expiracao > NOW()`,
      [email, codigo]
    );

    if (registros.length === 0) {
      conn.release();
      return res.status(400).json({ error: 'Código inválido ou expirado.' });
    }

    // Atualiza a senha do usuário
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await conn.execute(
      'UPDATE usuarios SET senha = ? WHERE email = ?',
      [senhaHash, email]
    );

    // Marca o código como usado
    await conn.execute(
      'UPDATE recuperacao_senha SET usado = 1 WHERE email = ?',
      [email]
    );

    conn.release();

    res.status(200).json({ message: 'Senha redefinida com sucesso!' });

  } catch (error) {
    console.error('=== ERRO REDEFINIR SENHA ===');
    console.error('Mensagem:', error.message);
    res.status(500).json({ error: 'Erro ao redefinir senha. Tente novamente.' });
  }
};