const connection = require("../config/db");

exports.loginUsuario = (req, res) => {
    const { email, senha, } = req.body;

    if ( !email || !senha) {
      return res.status(400).json({ error: " email e senha são obrigatórios" });
    }
    connection.query(
        "SELECT * FROM usuarios WHERE email = ? and senha = ? ",
        [ email, senha],
        (err, results) => {
          if (err) {
            res.status(500).json({ error: "Erro ao encontrar usuário" });
          } else {
            res.json({ id: results.insertId, email, senha });
          }
        }
      );
};

exports.cadastrarUsuario = (req, res) => {
  const { nome, sobrenome, email, senha, endereco, numero_endereco } = req.body;

  if (!nome || !sobrenome || !email || !senha) {
    return res.status(400).json({ error: "Nome, sobrenome, email e senha são obrigatórios" });
  }

  connection.query(
    "INSERT INTO usuarios (nome, sobrenome, email, senha, endereco, numero_endereco) VALUES (?, ?, ?, ?, ?, ?)",
    [nome, sobrenome, email, senha, endereco, numero_endereco],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: "Erro ao inserir usuário" });
      } else {
        res.json({ id: results.insertId, nome, sobrenome, email });
      }
    }
  );
};

