const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Room = require("../models/Room");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");;

const StudentController = {
    create: async (req, res) => {
        try {
            const {
                name,
                email,
                password
            } = req.body;

            // Verifica se o e-mail já existe
            const existingStudent = await Student.findOne({
                email
            });
            if (existingStudent) {
                return res.status(400).json({
                    message: "Este e-mail já está cadastrado."
                });
            }

            const newStudent = await Student.create({
                name,
                email,
                password,
                rooms: []
            });
            return res.status(201).json(newStudent);
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

            const student = await Student.findOne({
                email
            });

            if (!student) {
                return res.status(401).json({
                    message: "Email ou senha incorreta!"
                });
            }

            const isPasswordValid = await bcrypt.compare(password, student.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    message: "E-mail ou senha incorretos."
                });
            }

            //Gera o token do tipo estudante
            const token = generateToken(student, "student");

            return res.status(200).json({
                message: "Login realizado com sucesso!",
                token,
                student: {
                    id: student._id,
                    name: student.name
                }
            });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    getMyRooms: async (req, res) => {
        try {
            const {
                id
            } = req.params;
            const student = await Student.findById(id).populate({
                path: 'rooms',
                populate: {
                    path: 'teacher',
                    select: 'name'
                } // Traz o nome do professor da sala
            });

            if (!student) {
                return res.status(404).json({
                    message: "Aluno não encontrado."
                });
            }

            return res.status(200).json(student.rooms);
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    getProfile: async (req, res) => {
        try {
            const { id } = req.params;

            const requesterId = req.user.id;
            const requesterEntity = req.user.entity;

            // 1. Validar formato do ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: "ID inválido."
                });
            }

            if (requesterId !== id && requesterEntity !== "teacher") {
                // Se não for o dono e o token NÃO for de professor, nem precisa ir ao banco
                return res.status(403).json({
                    message: "Acesso negado."
                });
            }

            const student = await Student.findById(id).select("-password");

            if (!student) {
                return res.status(404).json({
                    message: "Não encontrado o id"
                });
            }

            return res.status(201).json({
                message: "Estudante localiza",
                student
            });
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    },

    delete: async (req, res) => {
        try {
            const {
                id
            } = req.params;

            // Dentro do método delete ou em um middleware:
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: "O formato do ID fornecido é inválido."
                });
            }

            //1. Verifica o ID existe no banco?
            const student = await Student.findById(id);
            if (!student) {
                return res.status(404).json({
                    message: "Aluno não encontrado!"
                })
            }

            //2. Remoção em cascata(Limpando referencias)
            // Remove o Id do aluno do array 'students' de TODAS as salas 

            await Room.updateMany({
                students: id
            }, {
                $pull: {
                    students: id
                }
            });

            // Remove o ID do aluno do array 'students' de TODOS os professores
            await Teacher.updateMany({
                students: id
            }, {
                $pull: {
                    students: id
                }
            });
            // 3. Deleta o documento do Aluno propriamente dito
            await Student.findByIdAndDelete(id);

            return res.status(200).json({
                message: "Aluno removido com sucesso."
            });
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }
};

module.exports = StudentController;