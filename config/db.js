import mysql from "mysql2";

const connection = mysql.createConnection({
  host: "localhost",
  port: 3307,
  user: "root",
  password: "root",
  database: "drop"
});

connection.connect(err => {
  if (err) {
    console.error("❌ Erro ao conectar no banco:", err);
    return;
  }
  console.log("✅ Conectado ao MySQL!");
});

export default connection;
