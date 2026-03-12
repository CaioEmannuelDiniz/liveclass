const Room = require("../models/Room");
const Teacher = require("../models/Teacher");
const crypto = require("crypto"); // Módulo nativo para gerar o código

const RoomController = {
    // Criar uma nova sala e gerar código único
    create: async (req, res) => {
        try {
            const { name, teacherId } = req.body;

            // 1. Verificar se o professor existe
            const teacher = await Teacher.findById(teacherId);
            if (!teacher) {
                return res.status(404).json({ message: "Professor não encontrado." });
            }

            // 2. Gerar um código aleatório de 6 caracteres (Ex: D8F2A1)
            const roomCode = crypto.randomBytes(3).toString("hex").toUpperCase();

            // 3. Criar a sala vinculada ao professor
            const newRoom = await Room.create({
                name,
                code: roomCode,
                teacher: teacherId,
                students: [] 
            });

            // 4. Vincular a sala ao documento do professor (Relação 1:1)
            teacher.room = newRoom._id;
            await teacher.save();

            return res.status(201).json(newRoom);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Buscar todos os alunos anexados a essa sala
    getRoomStudents: async (req, res) => {
        try {
            const { id } = req.params;

            // Buscamos a sala e trazemos (populate) os dados dos alunos
            const room = await Room.findById(id).populate("students", "name email");
            
            if (!room) {
                return res.status(404).json({ message: "Sala não encontrada." });
            }

            return res.status(200).json(room.students);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Buscar detalhes da sala pelo código (Útil para o Frontend antes do Socket)
    getByCode: async(req, res) =>{
    try {
      const { code } = req.params;
      const room = await Room.findOne({ code }).populate("teacher", "name");

      if (!room) {
        return res.status(404).json({ message: "Código de sala inválido." });
      }

      return res.status(200).json(room);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

module.exports = RoomController;