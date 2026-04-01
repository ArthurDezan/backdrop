const express         = require("express");
const router          = express.Router();
const pedidoController = require("../controller/pedido.controller");
const { authLoja }    = require("./loja.routes");

// Rotas existentes — mantidas
router.post("/create-checkout-session", pedidoController.criarSessaoCheckout);
router.post("/confirmar-pedido",        pedidoController.confirmarPedido);

// Novas rotas para a loja
router.get("/loja/:estabelecimento_id", authLoja, pedidoController.getPedidosPorLoja);
router.patch("/:id/status",             authLoja, pedidoController.atualizarStatusPedido);

module.exports = router;