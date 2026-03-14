const Room = require("../models/Room");
const Teacher = require("../models/Teacher");
const mongoose = require("mongoose");
const crypto = require("crypto"); // Módulo nativo para gerar o código

const RoomController = {
    // Criar uma nova sala e gerar código único
    create: async (req, res) => {
        try {
            const {
                name,
                teacherId
            } = req.body;

            // 1. Verificar se o professor existe
            const teacher = await Teacher.findById(teacherId);
            if (!teacher) {
                return res.status(404).json({
                    message: "Professor não encontrado."
                });
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
            return res.status(500).json({
                error: error.message
            });
        }
    },

    // Entra no array da sala e adiciona ao estudante
    joinRoom: async (req, res) => {
        try {
            const {
                id
            } = req.params; // ID da sala
            const studentId = req.user.id; // ID do aluno vindo do token (auth middleware)


            // 1. Adiciona o aluno ao array apenas se ele já não estiver lá ($addToSet)
            const room = await Room.findByIdAndUpdate(
                id, {
                    $addToSet: {
                        students: studentId
                    }
                }, {
                    new: true
                }
            );

            if (!room) {
                return res.status(404).json({
                    message: "Sala não encontrada."
                });
            }

            if (!room.isActive) {
                return res.status(400).json({
                    message: "Esta sala já foi encerrada."
                });
            }

            // 2. Também é boa prática adicionar a sala ao perfil do aluno
            await Student.findByIdAndUpdate(studentId, {
                $addToSet: {
                    rooms: id
                }
            });

            return res.status(200).json({
                message: "Inscrição realizada com sucesso!",
                room
            });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    // Buscar todos os alunos anexados a essa sala
    getRoomStudents: async (req, res) => {
        try {
            const {
                id
            } = req.params;

            // Buscamos a sala e trazemos (populate) os dados dos alunos
            const room = await Room.findById(id).populate("students", "name email");

            if (!room) {
                return res.status(404).json({
                    message: "Sala não encontrada."
                });
            }

            return res.status(200).json(room.students);
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    // Buscar todas as salas disponiveis
    getRooms: async (req, res) => {
        try {
            // 1. Pegar a página e o limite dos query params (ex: /rooms?page=1&limit=10)
            // Se não vier nada, assume página 1 e limite 10
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            // Calcular quantos documentos pular
            const skip = (page - 1) * limit;

            // 2. Buscar as salas com paginação
            const rooms = await Room.find({
                    isActive: true
                })
                .populate("teacher", "name")
                .select("-students")
                .skip(skip)
                .limit(limit);

            // 3. (Opcional) Contar o total de salas para o Frontend saber quantas páginas existem
            const totalRooms = await Room.countDocuments({
                isActive: true
            });

            return res.status(200).json({
                total: totalRooms,
                page,
                totalPages: Math.ceil(totalRooms / limit),
                rooms
            });
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    // Buscar uma sala especifica pelo id
    getRoom: async (req, res) => {
        try {
            const {
                id
            } = req.params;

            // 1. Validar ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: "ID da sala inválido."
                });
            }

            // 2. Buscar a sala populando o professor e alunos (trazendo apenas o nome e email)
            const room = await Room.findById(id)
                .populate("teacher", "name email")
                .populate("students", "name email");

            // 3. Verificar se existe e se está ativa
            if (!room || !room.isActive) {
                return res.status(404).json({
                    message: "Esta sala não está disponível ou foi encerrada."
                });
            }

            // 4. Retornar os dados para o frontend montar a tela da aula
            return res.status(200).json({
                message: "Acesso à sala autorizado",
                room
            });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    getRoomsTeacher: async (req, res) => {},

    // Buscar detalhes da sala pelo código (Útil para o Frontend antes do Socket)
    getByCode: async (req, res) => {
        try {
            const {
                code
            } = req.params;

            const room = await Room.findOne({
                code
            }).populate("teacher", "name");

            if (!room) {
                return res.status(404).json({
                    message: "Código de sala inválido."
                });
            }

            return res.status(200).json(room);
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    // Atualizar algum dado da sala 
    updateRoom: async (req, res) => {
        try {
            const {
                id
            } = req.params;
            const updates = req.body;

            const room = await Room.findById(id);

            if (!room) {
                return res.status(404).json({
                    message: "Sala não encontrada!"
                });
            }

            // Validação de Dono: Apenas o professor que criou pode editar
            if (room.teacher.toString() !== req.user.id || req.user.entity !== "teacher") {
                return res.status(403).json({
                    message: "Você não tem permissão para editar esta sala."
                });
            }

            // Atualiza apenas os campos enviados no body
            const updatedRoom = await Room.findByIdAndUpdate(id, updates, {
                new: true
            });

            return res.status(200).json({
                message: "Sala atualizada com sucesso!",
                room: updatedRoom
            });
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    // Adicionar ou retirar um aluno na sala 
    updateStudentsRoom: async (req, res) => {
        try {
            const {
                id
            } = req.params;
            const {
                studentId,
                action
            } = req.body; // action pode ser 'add' ou 'remove'

            const room = await Room.findById(id);

            if (!room) {
                return res.status(404).json({
                    message: "Sala não encontrada!"
                });
            }

            // Validação de Dono
            if (room.teacher.toString() !== req.user.id) {
                return res.status(403).json({
                    message: "Ação não autorizada."
                });
            }

            let updateQuery = {};
            if (action === "add") {
                updateQuery = {
                    $addToSet: {
                        students: studentId
                    }
                };
            } else if (action === "remove") {
                updateQuery = {
                    $pull: {
                        students: studentId
                    }
                };
            } else {
                return res.status(400).json({
                    message: "Ação inválida. Use 'add' ou 'remove'."
                });
            }

            const updatedRoom = await Room.findByIdAndUpdate(id, updateQuery, {
                    new: true
                })
                .populate("students", "name email");

            return res.status(200).json({
                message: `Aluno ${action === "add" ? "adicionado" : "removido"} com sucesso!`,
                room: updatedRoom
            });
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    // Deletar a sala pelo o id
    delete: async (req, res) => {
        try {
            const {
                id
            } = req.params;

            // 1. Validação básica de ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: "O formato do ID fornecido é inválido."
                });
            }

            // 2. Busca a sala PRIMEIRO para saber quem é o dono
            const room = await Room.findById(id);

            if (!room) {
                return res.status(404).json({
                    message: "Sala não encontrada!"
                });
            }

            // 3. VALIDAÇÃO DE DONO (Ownership)
            // Verificamos se quem está logado (req.user.id) é o mesmo que criou a sala (room.teacher)
            const isOwner = room.teacher.toString() === req.user.id;
            const isTeacher = req.user.entity === "teacher";

            if (!isTeacher || !isOwner) {
                return res.status(403).json({
                    message: "Ação não autorizada. Apenas o professor criador desta sala pode desativá-la."
                });
            }

            // 4. Executa a desativação (Soft Delete)
            room.isActive = false;
            await room.save(); // Salva a alteração no banco

            // 5. Remove a referência no Professor
            await Teacher.findByIdAndUpdate(room.teacher, {
                $pull: {
                    rooms: id
                }
            });

            return res.status(200).json({
                message: "Sala desativada e removida da sua lista com sucesso."
            });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },
};

module.exports = RoomController;