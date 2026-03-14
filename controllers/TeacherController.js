const Teacher = require("../models/Teacher");
const Room = require("../models/Room");
const mongoose = require("mongoose");
const generateToken = require("../utils/generateToken");

const TeacherController = {

    // Criar um novo perfil de professor
    register: async (req, res) => {
        try {
            const {
                name,
                email,
                password
            } = req.body;

            // 1. Verificar se os campos básicos foram enviados
            if (!name || !email || !password) {
                return res.status(400).json({
                    message: "Preencha todos os campos obrigatórios."
                });
            }

            // 2. Verificar se o e-mail já está cadastrado
            const teacherExists = await Teacher.findOne({
                email
            });
            if (teacherExists) {
                return res.status(400).json({
                    message: "Este e-mail já está em uso."
                });
            }

            // 3. Criptografar a senha (Salt de 10 é o padrão seguro)
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 4. Criar o professor no banco
            const newTeacher = await Teacher.create({
                name,
                email,
                password: hashedPassword,
                entity: "teacher" // Garante que a entidade seja sempre professor
            });

            // 5. Retornar os dados (sem a senha por segurança)
            return res.status(201).json({
                message: "Professor cadastrado com sucesso!",
                teacher: {
                    id: newTeacher._id,
                    name: newTeacher.name,
                    email: newTeacher.email
                }
            });
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    login: async (req, res) => {
        try {
            const {
                email,
                password
            } = req.body;

            // 1. Verificar se preencheu tudo
            if (!email || !password) {
                return res.status(400).json({
                    message: "E-mail e senha são obrigatórios."
                });
            }

            // 2. Buscar o professor pelo e-mail
            const teacher = await Teacher.findOne({
                email
            });
            if (!teacher) {
                return res.status(401).json({
                    message: "E-mail ou senha inválidos."
                });
            }

            // 3. Comparar a senha digitada com a senha criptografada do banco
            const isPasswordCorrect = await bcrypt.compare(password, teacher.password);
            if (!isPasswordCorrect) {
                return res.status(401).json({
                    message: "E-mail ou senha inválidos."
                });
            }

            // 4. Gerar o Token JWT
            // O payload contém o ID e a entidade (teacher)
            const token = generateToken(teacher, "teacher");

            // 5. Retornar o token e os dados básicos do professor
            return res.status(200).json({
                message: "Login realizado com sucesso!",
                token,
                teacher: {
                    id: teacher._id,
                    name: teacher.name,
                    email: teacher.email
                }
            });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    // Buscar o perfil do professor logado
    getProfile: async (req, res) => {
        try {
            const teacher = await Teacher.findById(req.user.id).select("-password");
            if (!teacher) return res.status(404).json({
                message: "Professor não encontrado"
            });

            return res.status(200).json(teacher);
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    // Buscar todas as salas criadas por um professor específico
    getTeacherRooms: async (req, res) => {
        try {
            const {
                id
            } = req.params;

            // 1. Validar formato do ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: "ID inválido."
                });
            }

            // Validar se o ID é do próprio professor ou se é um admin consultando
            if (id !== req.user.id && req.user.entity !== "admin") {
                return res.status(403).json({
                    message: "Acesso negado aos dados deste professor."
                });
            }

            // Busca salas onde o campo 'teacher' corresponde ao ID
            const rooms = await Room.find({
                    teacher: id,
                    isActive: true
                })
                .populate("students", "name email");

            return res.status(200).json(rooms);
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    // Atualizar dados do professor
    update: async (req, res) => {
        try {
            const updates = req.body;
            delete updates.password; // Segurança: não atualizar senha por aqui

            const teacher = await Teacher.findByIdAndUpdate(req.user.id, updates, {
                new: true
            });
            return res.status(200).json(teacher);
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    // Deleta o perfil do professor e desativa suas salas
    delete: async (req, res) => {
        try {
            // Pegamos o ID direto do Token (injetado pelo middleware auth)
            const id = req.user.id;

            // 1. Busca o professor
            const teacher = await Teacher.findById(id);
            if (!teacher) {
                return res.status(404).json({
                    message: "Professor não encontrado!"
                });
            }

            // 2. Desativa as salas dele (Cascata)
            await Room.updateMany({
                teacher: id
            }, {
                isActive: false
            });

            // 3. Deleta o perfil
            await Teacher.findByIdAndDelete(id);

            return res.status(200).json({
                message: "Sua conta e suas salas foram removidas com sucesso."
            });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }
};

module.exports = TeacherController;