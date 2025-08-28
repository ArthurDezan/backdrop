const express = require("express");
const { loginUsuario, cadastrarUsuario } = require("../controller/usuario.controller");

const router = express.Router();

router.post("/login", loginUsuario);
router.post("/cadastrar", cadastrarUsuario);

module.exports = router;
