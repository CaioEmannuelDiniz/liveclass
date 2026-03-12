const express = require("express");
const router = express.Router();
const StudentController = require("../controllers/StudentController");
const auth = require("../middlewares/auth");

// Cadastro
router.post("/", StudentController.create);

// Login
router.post("/login",StudentController.login);
// Ver perfil
router.get("/:id",auth, StudentController.getProfile);
// Ver minhas salas
router.get("/:id/rooms",auth, StudentController.getMyRooms); 
// Deletar perfil
router.delete("/:id",auth,StudentController.delete);

module.exports = router;