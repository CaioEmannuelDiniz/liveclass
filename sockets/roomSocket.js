const Room = require("../models/Room");
const Student = require("../models/Student");

module.exports = (io) => {
    io.on("connection", (socket) => {

        socket.on("join_with_code", async (data) => {
            // Lógica de buscar no banco e dar socket.join(roomId)
            // ... (aquela lógica que te passei na resposta anterior)
            const {
                studentId,
                roomCode
            } = data;

            try {
                // 1. Procura a sala pelo código
                const room = await Room.findOne({
                    code: roomCode
                });

                if (!room) {
                    return socket.emit("error_join", "Ops! Código de sala inválido.");
                }

                const isAlreadyInRoom = room.students.some(id => id.toString() === studentId);

                // 2. Verifica se o aluno já está na lista (evita duplicidade no DB)
                if (!isAlreadyInRoom) {
                    room.students.push(studentId);
                    await room.save();

                    // Também precisamos atualizar o array 'rooms' no model do Student (N:N)
                    await Student.findByIdAndUpdate(studentId, {
                        $addToSet: {
                            rooms: room._id
                        }
                    });
                }

                // 3. Conecta o socket na sala em tempo real
                socket.join(room._id.toString());

                // 4. Avisa o aluno que deu certo
                socket.emit("joined_success", {
                    roomId: room._id,
                    roomName: room.name
                });

                // 5. Avisa a sala que um novo colega chegou
                socket.to(room._id.toString()).emit("new_student_joined", `Um novo aluno entrou usando o código!`);

            } catch (error) {
                socket.emit("error_join", "Erro interno ao tentar entrar na sala.");
            }
        });
    });

};