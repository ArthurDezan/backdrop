const express = require('express');
const router = express.Router();
const estabelecimentoController = require('../controller/estabelecimento.controller');

// Rota GET /estabelecimentos
router.get('/estabelecimento', estabelecimentoController.getAllEstabelecimentos);

module.exports = router;
