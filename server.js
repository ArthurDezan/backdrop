const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const corsMiddleware = require("./middleware/cors");

// Importar rotas
const usuarioRoutes = require("./routes/usuario.routes");
const estabelecimentoRoutes = require('./routes/estabelecimento.routes');
const produtoRoutes = require("./routes/produto.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// ======================================================
// ✅ CORREÇÃO AQUI
// ======================================================
// Middlewares de segurança e configuração
app.use(helmet({
  crossOriginResourcePolicy: false, // Permite que imagens sejam carregadas de outras origens
}));
// ======================================================

app.use(corsMiddleware); // A sua configuração de CORS continua a mesma
app.use(express.static('public')); // A sua configuração de ficheiros estáticos também
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));


// Middleware de log básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Registar as rotas na aplicação
app.use("/usuarios", usuarioRoutes);
app.use('/estabelecimentos', estabelecimentoRoutes);
app.use("/produtos", produtoRoutes);

// Rota de teste geral
app.get("/", (req, res) => {
  res.json({
    message: "API funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Middlewares de erro (sem alteração)
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