require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const setupRoomSocket = require("./sockets/roomSocket");
const studentRoutes = require("./routes/studentRoutes");
const { env } = require("process");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

app.use('/students', studentRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.log("Erro ao conectar:", err));



setupRoomSocket(io);


server.listen(process.env.PORT, () => {
  console.log("Servidor rodando na porta 3000");
});