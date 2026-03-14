const express = require("express");
const router = express.Router();
const TeacherController = require("../controllers/TeacherController");
const auth = require("../middlewares/auth");

// Rota pública para cadastro
router.post("/register", TeacherController.register);

// Rota de Login 
router.post("/login", TeacherController.login);

// Rota para o professor ver o próprio perfil
router.get("/profile", auth, TeacherController.getProfile);

// Rota para o professor ver suas salas (Dashboard)
router.get("/:id/rooms", auth, TeacherController.getTeacherRooms);

// Rota para o professor editar seus dados
router.patch("/update", auth, TeacherController.update);

// Rota para deletar a própria conta (Sem ID na URL)
router.delete("/", auth, TeacherController.delete);

module.exports = router;