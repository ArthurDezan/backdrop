// routes/loja.routes.js

const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const lojaCtrl = require('../controller/loja.controller');

const JWT_SECRET = process.env.JWT_SECRET || 'drop_secret_key';

// -----------------------------------------------------
// Middleware: valida token JWT de loja
// Injeta req.loja = { id, tipo }
// -----------------------------------------------------
function authLoja(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) {
    return res.status(401).json({ erro: 'Token não enviado' });
  }

  const token = header.split(' ')[1];
  try {
    req.loja = jwt.verify(token, JWT_SECRET);
    if (req.loja.tipo !== 'loja') {
      return res.status(403).json({ erro: 'Acesso negado: não é uma conta de loja' });
    }
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

// Rotas públicas
router.post('/cadastrar', lojaCtrl.cadastrar);
router.post('/login',     lojaCtrl.login);
router.get('/',           lojaCtrl.listar);

// Rotas privadas
router.get('/me',     authLoja, lojaCtrl.getMe);
router.put('/:id',    authLoja, lojaCtrl.atualizarPerfil);

module.exports = router;
module.exports.authLoja = authLoja;