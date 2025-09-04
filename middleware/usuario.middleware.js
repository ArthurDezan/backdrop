const jwt = require("jsonwebtoken");

exports.require = async (req, res, next) => {
    try {
        res.locals.idUsuario = 0;
        res.locals.admin = 0;

        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, "senhafojwt");

        if (decoded.id) {
            res.locals.idUsuario = decoded.id;
            res.locals.admin = decoded.admin;
            next();
        } else {
            return res.status(401).json({
                "Mensagem": "Usuario não autorizado"
            });
        }
    } catch (error) {
        return res.status(500).json({
            "error": error
        });
    }
};

exports.adminRequeriment = async (req, res, next) => {
    try {
        if (!res.locals.admin) {
            return res.status(403).json({
                "Mensagem": "Apenas administradores podem realizar esta ação"
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            "error": error
        });
    }
};