const cors = require("cors");

// Configuração do CORS atualizada com PATCH
const corsOptions = {
  origin: [
    "http://localhost:8100", // Ionic dev server
  ],
  // 🔥 ADICIONADO: "PATCH" incluído na lista de métodos permitidos
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], 
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin"
  ], 
  credentials: true, 
  optionsSuccessStatus: 200, 
  preflightContinue: false
};

module.exports = cors(corsOptions);