const express = require("express");
const router = express.Router();
const usuarioController = require("../controller/usuario.controller");
const login = require("../middleware/usuario.middleware");

// Rota de teste (funciona para verificar se o servidor está ok)
router.get("/", (req, res) => res.send("Lista de usuários - API funcionando"));

// Rotas públicas (não precisam de autenticação)
router.post("/enviar-codigo", usuarioController.enviarCodigo);
router.post("/cadastrar", usuarioController.cadastrarUsuario);
router.post("/login", usuarioController.loginUsuario);

// Rotas protegidas (precisam de autenticação)
router.put("/", login.require, usuarioController.atualizarUsuario);

router.get("/me", login.require, usuarioController.getUsuarioLogado);


module.exports = router;