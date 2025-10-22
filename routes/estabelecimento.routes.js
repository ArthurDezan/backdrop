const express = require('express');
const router = express.Router();
const estabelecimentoController = require('../controller/estabelecimento.controller');

// Rota GET /estabelecimentos
// Alterado de '/estabelecimento' para '/'
router.get('/', estabelecimentoController.getAllEstabelecimentos);
router.get('/:id', estabelecimentoController.getEstabelecimentoById);

module.exports = router;