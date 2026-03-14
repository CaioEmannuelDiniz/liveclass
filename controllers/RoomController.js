const Room = require("../models/Room");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const mongoose = require("mongoose");
const crypto = require("crypto");

const RoomController = {
    // Criar uma nova sala e gerar código único
    create: async (req, res) => {
        try {
            const {
                name
            } = req.body;
            const teacherId = req.user.id;

            let isUnique = false;
            let roomCode; // Declarada aqui no topo da função

            // 1. REGRA DE OURO: Verifica se já existe uma sala ATIVA
            const activeRoom = await Room.findOne({
                teacher: teacherId,
                isActive: true
            });

            if (activeRoom) {
                return res.status(400).json({
                    message: "Você já possui uma sala ativa. Encerre-a antes de criar uma nova."
                });
            }

            // 2. Loop de geração de código
            while (!isUnique) {
                // REMOVI O 'const' DAQUI DE BAIXO
                roomCode = crypto.randomBytes(3).toString("hex").toUpperCase();

                const existingCode = await Room.findOne({
                    code: roomCode
                });

                if (!existingCode) {
                    isUnique = true;
                }
            }

            // 3. Criar a sala (Agora o roomCode está acessível e preenchido)
            const newRoom = await Room.create({
                name,
                code: roomCode,
                teacher: teacherId,
                students: []
            });

            // 4. Vincular ao professor
            await Teacher.findByIdAndUpdate(teacherId, {
                room: newRoom._id
            });

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
            ).populate("students", "name").populate("teacher", "name");

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

    // Buscar detalhes da sala pelo código (Útil para o Frontend antes do Socket)
    getByCode: async (req, res) => {
        try {
            const {
                code
            } = req.params;

            // Buscamos apenas se estiver ativa
            const room = await Room.findOne({
                code: code.toUpperCase(), // Garante que ignore o case (D8F2A1 vs d8f2a1)
                isActive: true
            }).populate("teacher", "name").populate("students", "name");

            if (!room) {
                return res.status(404).json({
                    message: "Sala não encontrada ou código inválido."
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

            if (!room.isActive) {
                return res.status(400).json({
                    message: "Sala não esta ativa!"
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

            if (!room.isActive) {
                return res.status(400).json({
                    message: "Sala não esta ativa!"
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

            // 5. Remove a referência no Professor
            await Teacher.findByIdAndUpdate(room.teacher, {
                $set: {
                    room: null
                }
            })

            await room.save(); // Salva a alteração no banco

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