require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const corsMiddleware = require("./middleware/cors");
const authRoutes = require('./routes/auth.routes');

// Importar rotas
const usuarioRoutes       = require("./routes/usuario.routes");
const estabelecimentoRoutes = require('./routes/estabelecimento.routes');
const produtoRoutes       = require("./routes/produto.routes");
const pedidoRoutes        = require('./routes/pedido.route');
const lojaRoutes          = require('./routes/loja.routes'); // ← NOVO

// Importar o controller SÓ para o webhook
const pedidoController = require('./controller/pedido.controller');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(corsMiddleware);
app.use(express.static('public'));

// 1. ROTA DE WEBHOOK (ANTES DE TUDO)
app.post("/pedidos/webhook", bodyParser.raw({ type: 'application/json' }), pedidoController.handleWebhook);

// 2. PARSERS GLOBAIS
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// 3. REGISTRO DAS ROTAS
app.use("/usuarios",        usuarioRoutes);
app.use('/estabelecimentos', estabelecimentoRoutes);
app.use("/produtos",        produtoRoutes);
app.use("/pedidos",         pedidoRoutes);
app.use('/auth',            authRoutes);
app.use('/lojas',           lojaRoutes); // ← NOVO

// Middleware de log básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API funcionando!", timestamp: new Date().toISOString() });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada", path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});