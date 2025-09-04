const express = require("express");
const cors = require("cors");
const usuarioRoutes = require("./routes/usuario.routes.js");

const app = express();

app.use("/cadastro", usuarioRoutes);

// Configuração do CORS
app.use(cors({
  origin: "http://localhost:8100", // endereço do front-end Ionic
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware para ler JSON
app.use(express.json());

// Rotas
app.get("/", (req, res) => {
  res.send("API do banco DROP funcionando 🚀");
});

app.use("/usuarios", usuarioRoutes);

// Iniciar servidor
app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});

