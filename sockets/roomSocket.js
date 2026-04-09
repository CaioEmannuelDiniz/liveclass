const Room = require("../models/Room");
const Student = require("../models/Student");

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log(`🔌 Novo usuário conectado: ${socket.id}`);

        // --- ENTRADA NA SALA ---
        socket.on("join_with_code", async (data) => {
            let { studentId, roomCode } = data;
            try {
                const roomCodeFixed = roomCode.trim().toUpperCase();
                const room = await Room.findOne({ code: roomCodeFixed });

                if (!room) {
                    return socket.emit("error_join", "Ops! Código de sala inválido.");
                }

                // 1. Busca o nome do aluno no banco para o sistema usar
                const student = await Student.findById(studentId);
                const userName = student ? student.name : "Novo aluno";

                // 2. Salva os dados no objeto socket para recuperar no disconnect
                socket.userName = userName;
                socket.roomCode = roomCodeFixed;

                // Verifica se é o professor
                const isTeacher = room.teacher.toString() === studentId;

                const isAlreadyInRoom = room.students.some(id => id.toString() === studentId);
                if (!isAlreadyInRoom) {
                    room.students.push(studentId);
                    await room.save();
                }

                socket.join(roomCodeFixed);

                // Envia sucesso apenas para quem entrou
                socket.emit("joined_success", {
                    roomId: room._id,
                    roomName: room.name,
                    isTeacher: isTeacher 
                });

                // --- CORREÇÃO DISPARO DUPLO ---
                // socket.to(...) envia para todos na sala EXCETO para quem está entrando.
                // Isso evita que o aluno receba a própria mensagem de entrada.
                socket.to(roomCodeFixed).emit("receive_message", {
                    author: "Sistema",
                    text: `${userName} entrou na sala.`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });

            } catch (error) {
                console.error("Erro no join:", error);
                socket.emit("error_join", "Erro interno ao entrar na sala.");
            }
        });

        // --- FECHAR SALA (Apenas Professor) ---
        socket.on("close_room", async (data) => {
            const { roomCode, userId } = data;
            const roomCodeFixed = roomCode.trim().toUpperCase();

            try {
                const room = await Room.findOne({ code: roomCodeFixed });
                if (!room) return;

                if (room.teacher.toString() !== userId) {
                    return socket.emit("receive_message", {
                        author: "Sistema",
                        text: "Erro: Você não tem permissão para fechar esta sala.",
                        time: ""
                    });
                }

                io.to(roomCodeFixed).emit("room_closed_by_teacher");
                console.log(`🛑 Sala ${roomCodeFixed} encerrada pelo professor.`);
            } catch (error) {
                console.error("Erro ao fechar sala:", error);
            }
        });


        // --- CHAT ---
        socket.on("send_message", (data) => {
            if (!data.room) return;
            const roomTarget = data.room.trim().toUpperCase();
            
            // Aqui usamos io.to para que o remetente também veja sua mensagem no chat
            io.to(roomTarget).emit("receive_message", {
                author: data.author,
                text: data.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        });

        // --- CORREÇÃO NOME NA SAÍDA E DESCONEXÃO ---
        // 'disconnecting' é disparado enquanto o socket ainda está nas salas (rooms)
        socket.on("disconnecting", () => {
            if (socket.roomCode && socket.userName) {
                socket.to(socket.roomCode).emit("receive_message", {
                    author: "Sistema",
                    text: `${socket.userName} saiu da sala.`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            }
            console.log(`❌ Usuário desconectado: ${socket.id}`);
        });
    });
};