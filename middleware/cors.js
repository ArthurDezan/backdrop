// middleware/cors.js
const cors = require("cors");

// Configuração do CORS
const corsOptions = {
  origin: "http://localhost:8100", // URL do seu front-end Ionic
  methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
  allowedHeaders: ["Content-Type", "Authorization"], // Cabeçalhos permitidos
  credentials: true, // Permitir cookies, se necessário
};

module.exports = cors(corsOptions);
