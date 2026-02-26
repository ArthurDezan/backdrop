const mysql = require("../config/mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

let codigosVerificacao = {}

const transporter = nodemailer.createTransport({
    service: 'gmail', // Ou seu serviço de e-mail
    auth: {
        user: 'apdezan78@gmail.com',
        pass: 'iykj nimg mmfh qhvi' 
    }
});

exports.loginUsuario = async (req, res) => {
  try {
      const { email, senha } = req.body;

      if (!email || !senha) {
          return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      // Executando a query
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

      // Gerar token JWT
      const token = jwt.sign(
          {
              id: usuario.id,
              nome: usuario.nome,
              sobrenome: usuario.sobrenome,
              email: usuario.email,
              admin: usuario.admin || 0
          },
          "senhafojwt",
          { expiresIn: '1h' } // opcional: expira em 1h
      );

      // Retornar usuário sem senha
      const { senha: _, ...dadosUsuario } = usuario;

      return res.status(200).json({
          Mensagem: "Usuario logado com sucesso",
          Resultado: dadosUsuario,
          token
      });

  } catch (error) {
      console.error("Erro no loginUsuario:", error); // Log para depuração
      return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

exports.enviarCodigo = async (req, res) => {
    const { email } = req.body;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    
    codigosVerificacao[email] = { 
        codigo, 
        expiracao: Date.now() + 600000 // Expira em 10 minutos
    };

    try {
        await transporter.sendMail({
            from: '"Drop Delivery" <seu-email@gmail.com>',
            to: email,
            subject: "Seu código de verificação",
            text: `Seu código é: ${codigo}`,
            html: `<b>Seu código é: ${codigo}</b>`
        });
        res.status(200).json({ Mensagem: "Código enviado com sucesso" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao enviar e-mail" });
    }
};

exports.cadastrarUsuario = async (req, res) => {
    try {
        const { nome, sobrenome, email, senha, endereco, numero_endereco, codigo } = req.body;

        // VERIFICAÇÃO DO CÓDIGO
        const infoCodigo = codigosVerificacao[email];
        if (!infoCodigo || infoCodigo.codigo !== codigo || Date.now() > infoCodigo.expiracao) {
            return res.status(400).json({ error: "Código inválido ou expirado" });
        }

        // Se o código estiver certo, remove ele e segue o cadastro
        delete codigosVerificacao[email];

        const hash = await bcrypt.hash(senha, 10);
        const resultado = await mysql.execute(
            `INSERT INTO usuarios (nome, sobrenome, email, senha, endereco, numero_endereco)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, sobrenome, email, hash, endereco, numero_endereco]
        );

        return res.status(201).json({ "Mensagem": "Usuario criado com sucesso" });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

exports.atualizarUsuario = async (req, res) => {
    try {
        const resultado = await mysql.execute(
            `UPDATE usuarios 
                 SET nome = ?,
                     sobrenome = ?,
                     email = ?,
                     endereco = ?,
                     numero_endereco = ?
            WHERE id = ?;`,
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
            "Mensagem": "Usuario atualizado com sucesso",
            "Resultado": resultado
        });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

exports.getUsuarioLogado = async (req, res) => {
    try {
      // O ID do usuário é pego do middleware 'login.require'
      //
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
      
      // NUNCA retorne a senha, mesmo que hasheada
      const { senha: _, ...dadosUsuario } = usuario;
  
      return res.status(200).json(dadosUsuario); // Retorna os dados do usuário
  
    } catch (error) {
      console.error("Erro em getUsuarioLogado:", error);
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  };