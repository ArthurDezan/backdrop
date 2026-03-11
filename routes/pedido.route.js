const express = require("express");
const router = express.Router();
const pedidoController = require("../controller/pedido.controller");

// Rota para criar a sessão de pagamento
router.post("/create-checkout-session", pedidoController.criarSessaoCheckout);

// ✅ NOVA ROTA: Confirmar e salvar pedido após retorno do Stripe (sem precisar do Stripe CLI)
router.post("/confirmar-pedido", pedidoController.confirmarPedido);

// A rota /webhook está no server.js para lidar com o parser 'raw'

module.exports = router;