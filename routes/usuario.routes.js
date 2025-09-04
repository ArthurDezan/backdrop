const express = require("express");
const { loginUsuario, cadastrarUsuario } = require("../controller/usuario.controller");

const router = express.Router();

// Rota de teste (funciona para verificar se o servidor está ok)
router.get("/", (req, res) => res.send("Lista de usuários - API funcionando 🚀"));

// Rotas reais do sistema
router.post("/login", loginUsuario);
router.post("/cadastrar", cadastrarUsuario);

module.exports = router;
