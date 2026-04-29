const express         = require("express");
const router          = express.Router();
const pedidoController = require("../controller/pedido.controller");
const { authLoja }    = require("./loja.routes");

// Rotas existentes
router.post("/create-checkout-session", pedidoController.criarSessaoCheckout);
router.post("/confirmar-pedido",        pedidoController.confirmarPedido);

// Rota NOVA para a conexão em tempo real (sem authLoja para não bloquear o EventSource)
router.get("/stream/:estabelecimento_id", pedidoController.streamPedidos);

// Rotas para a loja
router.get("/loja/:estabelecimento_id", authLoja, pedidoController.getPedidosPorLoja);
router.patch("/:id/status",             authLoja, pedidoController.atualizarStatusPedido);

module.exports = router;