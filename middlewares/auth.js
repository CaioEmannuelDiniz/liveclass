const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

module.exports = async (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "token não fornecido ou formato inválido."
        });
    }

    const token = authHeader.split(" ")[1];


    try {
        // 1. Verifica se a assinatura do token é válida
        const decoded = jwt.verify(token, SECRET);

        // 2. Busca o usuário no banco para ver se ele ainda existe
        // Usamos o 'entity' que você salvou no payload do JWT no login
        let userExists;
        if (decoded.entity === "student") {
            userExists = await Student.findById(decoded.id);
        } else if (decoded.entity === "teacher") {
            userExists = await Teacher.findById(decoded.id);
        }

        // 3. Se o usuário foi deletado, o findById retornará null
        if (!userExists) {
            return res.status(401).json({
                message: "Usuário não encontrado ou conta removida. Acesso negado."
            });
        }

        // 4. Se chegou aqui, o token é válido E o usuário existe
        req.user = decoded;
        next();

    } catch (err) {
        return res.status(401).json({
            message: "Token inválido ou expirado."
        });
    };
};