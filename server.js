// Carrega as variáveis de ambiente do .env
require("dotenv").config(); 

const express = require("express");
const bodyParser = require("body-parser"); // Usado para as rotas JSON normais
const helmet = require("helmet");
const corsMiddleware = require("./middleware/cors");

// Importar rotas
const usuarioRoutes = require("./routes/usuario.routes");
const estabelecimentoRoutes = require('./routes/estabelecimento.routes');
const produtoRoutes = require("./routes/produto.routes");
const pedidoRoutes = require("./routes/pedido.route"); // ✅ 1. Importar rotas de pedido

// ✅ Importar o handler do webhook DIRETAMENTE do controller
const { handleWebhook } = require("./controller/pedido.controller");

const app = express();
const PORT = process.env.PORT || 3000;

// ======================================================
// Middlewares de segurança e configuração
// ======================================================
app.use(helmet({
  crossOriginResourcePolicy: false, // Permite que imagens sejam carregadas
}));
app.use(corsMiddleware); // Seu middleware de CORS
app.use(express.static('public')); // Servir arquivos estáticos (imagens)

// Middleware de log básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ======================================================
// ✅ IMPORTANTE: ROTA DE WEBHOOK DO STRIPE
// Esta rota deve vir ANTES do bodyParser.json() global.
// O Stripe precisa do "corpo" (body) cru (raw) para verificar a assinatura.
// ======================================================
app.post(
  "/pedidos/webhook", 
  express.raw({ type: "application/json" }), 
  handleWebhook // Chama a função do controller diretamente
);

// ======================================================
// ✅ Parsers JSON para TODAS AS OUTRAS rotas
// ======================================================
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));


// ======================================================
// Registar as rotas na aplicação
// ======================================================
app.use("/usuarios", usuarioRoutes);
app.use('/estabelecimentos', estabelecimentoRoutes);
app.use("/produtos", produtoRoutes);

// ✅ Esta rota agora lidará com /pedidos/criar-checkout
// (pois /pedidos/webhook já foi processado acima)
app.use("/pedidos", pedidoRoutes); 

// Rota de teste geral
app.get("/", (req, res) => {
  res.json({
    message: "API funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// Middlewares de erro (sem alteração)
// ======================================================
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

// ======================================================
// Iniciar o servidor
// ======================================================
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});