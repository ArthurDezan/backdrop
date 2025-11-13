const express = require("express");
const router = express.Router();
const pedidoController = require("../controller/pedido.controller");

// Rota para criar a sessão de pagamento (esta rota usa o parser JSON)
router.post("/create-checkout-session", pedidoController.criarSessaoCheckout);

// A rota /webhook foi movida para o server.js para lidar com o parser 'raw'

module.exports = router;