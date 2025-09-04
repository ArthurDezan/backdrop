const mysql = require("../config/mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

exports.cadastrarUsuario = async (req, res) => {
    try {
        const { nome, sobrenome, email, senha, endereco, numero_endereco } = req.body;

        if (!nome || !sobrenome || !email || !senha) {
            return res.status(400).json({ 
                error: "Nome, sobrenome, email e senha são obrigatórios" 
            });
        }

        const hash = await bcrypt.hash(senha, 10);
        const resultado = await mysql.execute(
            `INSERT INTO usuarios (nome, sobrenome, email, senha, endereco, numero_endereco)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, sobrenome, email, hash, endereco, numero_endereco]
        );

        return res.status(201).json({
            "Mensagem": "Usuario criado com sucesso",
            "Resultado": resultado
        });

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