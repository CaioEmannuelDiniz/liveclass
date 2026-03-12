const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET

module.exports = (req,res,next)=>{
    const authHeader = req.headers["authorization"];

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({message: "token não fornecido ou formato inválido."});
    }

    const token = authHeader.split(" ")[1];


    jwt.verify(token, SECRET,(err, decoded)=>{
        
        if(err){
            return res.status(401).json({message:"Token inválido"});
        }
        

        req.user =decoded;
        next();
    });
};