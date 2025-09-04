const cors = require("cors");

// Configuração do CORS mais robusta
const corsOptions = {
  origin: [
    "http://localhost:8100", // Ionic dev server
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Métodos permitidos
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin"
  ], // Cabeçalhos permitidos
  credentials: true, // Permitir cookies e headers de autorização
  optionsSuccessStatus: 200, // Para suportar browsers legados
  preflightContinue: false
};

module.exports = cors(corsOptions);