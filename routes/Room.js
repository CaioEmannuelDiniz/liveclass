const express = require("express");
const router = express.Router();
const RoomController = require("../controllers/RoomController");

// Rota para o professor criar a sala
router.post("/", RoomController.create);

// Rota para o login 

// Rota para ver quem está na sala
router.get("/:id/students", RoomController.getRoomStudents);

module.exports = router;