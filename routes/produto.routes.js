const express = require("express");
const router = express.Router();
const produtoController = require("../controller/produto.controller");

// Rota para buscar produtos de um estabelecimento específico
// Ex: GET http://localhost:3000/produtos/estabelecimento/1
router.get("/estabelecimento/:id", produtoController.getProdutosPorEstabelecimento);

module.exports = router;