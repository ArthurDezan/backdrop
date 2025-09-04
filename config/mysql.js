const mysql = require("mysql2/promise"); // usar promise
require("dotenv").config(); // para ler variáveis do .env

// Cria pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "drop",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(conn => {
    console.log("✅ Conectado ao MySQL com sucesso!");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Erro ao conectar no MySQL:", err.message);
  });

module.exports = pool;
