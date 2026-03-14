const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const auth = require("../middlewares/auth"); // Certifique-se de importar seu middleware

// --- ROTAS DE BUSCA (GET) ---

// 1. Rota de código deve vir ANTES da rota de :id para não dar conflito
router.get("/code/:code", auth, roomController.getByCode);

// 2. Listagem geral (paginada)
router.get("/", auth, roomController.getRooms);

// 3. Detalhes de uma sala específica
router.get("/:id", auth, roomController.getRoom);

// 4. Ver as salas de um professor específico
router.get("/teacher/:id", auth, roomController.getRoomsTeacher);

// 5. Ver quem está na sala
router.get("/:id/students", auth, roomController.getRoomStudents);


// --- ROTAS DE AÇÃO (POST/PATCH/DELETE) ---

// 6. Criar sala
router.post("/", auth, roomController.create);

// 7. Aluno entrar na sala
router.post("/:id/join", auth, roomController.joinRoom);

// 8. Professor editar dados da sala (PATCH é melhor que PUT)
router.patch("/:id", auth, roomController.updateRoom);

// 9. Professor gerenciar alunos (add/remove)
router.patch("/:id/students", auth, roomController.updateStudentsRoom);

// 10. Deletar (Soft Delete)
router.delete("/:id", auth, roomController.delete);

module.exports = router;