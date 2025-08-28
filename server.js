const express = require("express");
const usuarioRoutes = require("./routes/usuario.routes.js");

const app = express();
app.use(express.json());

// Rotas

app.get("/", (req, res) => {
  res.send("API do banco DROP funcionando 🚀");
});

app.use("/usuarios", usuarioRoutes);

app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});
