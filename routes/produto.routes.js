const express      = require("express");
const router       = express.Router();
const produtoCtrl  = require("../controller/produto.controller");
const { authLoja } = require("./loja.routes"); // reutiliza o middleware já existente

// Público — clientes veem produtos do estabelecimento
router.get("/estabelecimento/:id", produtoCtrl.getProdutosPorEstabelecimento);

// Privado — só a loja autenticada pode gerenciar seus produtos
router.post("/",     authLoja, produtoCtrl.cadastrarProduto);
router.put("/:id",   authLoja, produtoCtrl.atualizarProduto);
router.delete("/:id", authLoja, produtoCtrl.deletarProduto);

module.exports = router;