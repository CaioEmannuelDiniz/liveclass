const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

module.exports = (user, entity) => {
    // Usamos o process.env aqui para garantir que pegue a chave do .env
    return jwt.sign(
        { 
            id: user._id, 
            entity: entity 
        },
        SECRET,
        { expiresIn: "1d" }
    );
};
