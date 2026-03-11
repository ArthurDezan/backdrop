// routes/auth.route.js
const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');

// Solicita o código de recuperação (envia email)
router.post('/solicitar-recuperacao', authController.solicitarRecuperacao);

// Valida o código e redefine a senha
router.post('/redefinir-senha', authController.redefinirSenha);

module.exports = router;