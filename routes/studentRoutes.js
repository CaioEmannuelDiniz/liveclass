const express = require("express");
const router = express.Router();
const StudentController = require("../controllers/StudentController");
const auth = require("../middlewares/auth");

// Cadastro
router.post("/register", StudentController.register);

// Login
router.post("/login",StudentController.login);
// Ver perfil
router.get("/profile",auth, StudentController.getProfile);
// Ver minhas salas
router.get("/rooms",auth, StudentController.getMyRooms); 
// Deletar perfil
router.delete("/",auth,StudentController.delete);

module.exports = router;