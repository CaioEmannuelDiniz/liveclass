require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const setupRoomSocket = require("./sockets/roomSocket");

// Importação das rotas
const studentRoutes = require("./routes/studentRoutes");
const roomRoutes = require("./routes/roomRoutes");
const teacherRoutes = require("./routes/teacherRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Definição das Rotas
app.use('/student', studentRoutes);
app.use('/teacher', teacherRoutes); 
app.use("/room", roomRoutes);


// Conexão com MongoDB (Corrigido)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado com sucesso"))
  .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

// Configuração do Socket
setupRoomSocket(io);

// Inicialização do Servidor (Corrigido)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});