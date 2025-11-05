// routes/pedido.routes.js
const express = require("express");
const router = express.Router();
const pedidoController = require("../controller/pedido.controller");

// Rota para o Angular chamar e criar a sessão
// Ex: POST http://localhost:3000/pedidos/criar-checkout
router.post("/criar-checkout", pedidoController.criarSessaoCheckout);

// Rota para o Stripe chamar (webhook)
// Ex: POST http://localhost:3000/pedidos/webhook
router.post("/webhook", pedidoController.handleWebhook);

module.exports = router;