require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser"); // Precisamos dos dois tipos de parser
const helmet = require("helmet");
const corsMiddleware = require("./middleware/cors");
const authRoutes = require('./routes/auth.routes'); // ✅ NOVO

// Importar rotas
const usuarioRoutes = require("./routes/usuario.routes");
const estabelecimentoRoutes = require('./routes/estabelecimento.routes');
const produtoRoutes = require("./routes/produto.routes");
const pedidoRoutes = require('./routes/pedido.route'); // Rota de Pedido

// Importar o controller SÓ para o webhook
const pedidoController = require('./controller/pedido.controller');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(corsMiddleware);
app.use(express.static('public'));

// ======================================================
// ✅ CORREÇÃO AQUI
// ======================================================

// 1. ROTA DE WEBHOOK (ANTES DE TUDO)
// Esta rota é especial e precisa do "body-parser" raw.
// O Stripe envia dados puros para verificação de assinatura.
app.post("/pedidos/webhook", bodyParser.raw({ type: 'application/json' }), pedidoController.handleWebhook);

// 2. PARSERS GLOBAIS (PARA TODAS AS OUTRAS ROTAS)
// Agora, usamos o parser JSON e URLencoded para o resto da API.
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// 3. REGISTO DAS OUTRAS ROTAS
// Estas rotas usarão os parsers JSON definidos acima.
app.use("/usuarios", usuarioRoutes);
app.use('/estabelecimentos', estabelecimentoRoutes);
app.use("/produtos", produtoRoutes);
app.use("/pedidos", pedidoRoutes); // Esta rota agora só vai lidar com o create-checkout-session
app.use('/auth', authRoutes); // ✅ NOVO

// ======================================================

// Middleware de log básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rota de teste geral
app.get("/", (req, res) => {
  res.json({
    message: "API funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    path: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});