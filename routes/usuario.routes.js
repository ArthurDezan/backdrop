const express = require("express");
const router = express.Router();
const usuarioController = require("../controller/usuario.controller");
const login = require("../middleware/usuario.middleware");

// Rota de teste
router.get("/", (req, res) => res.send("Lista de usuários - API funcionando"));

// Rotas públicas
router.post("/enviar-codigo", usuarioController.enviarCodigoCadastro);
router.post("/cadastrar", usuarioController.cadastrarUsuario);
router.post("/login", usuarioController.loginUsuario);

// Rotas protegidas (Perfil e Dados pessoais)
router.get("/me", login.require, usuarioController.getUsuarioLogado);
router.put("/:id", login.require, usuarioController.atualizarUsuario);
router.put("/perfil/foto", login.require, usuarioController.atualizarFoto);

// Rotas protegidas (Múltiplos Endereços)
router.get("/perfil/enderecos", login.require, usuarioController.listarEnderecos);
router.post("/perfil/enderecos", login.require, usuarioController.adicionarEndereco);
router.delete("/perfil/enderecos/:id", login.require, usuarioController.deletarEndereco);

// Rotas protegidas (Cartões / Pagamentos)
router.get("/perfil/cartoes", login.require, usuarioController.listarCartoes);
router.post("/perfil/cartoes", login.require, usuarioController.adicionarCartao);
router.delete("/perfil/cartoes/:id", login.require, usuarioController.deletarCartao);
router.put("/perfil/cartoes/:id/padrao", login.require, usuarioController.definirCartaoPadrao);

// Rotas protegidas (Configurações / Toggles)
router.get("/perfil/configuracoes", login.require, usuarioController.obterConfiguracoes);
router.put("/perfil/configuracoes", login.require, usuarioController.salvarConfiguracoes);

module.exports = router;