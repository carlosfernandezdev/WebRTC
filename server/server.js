const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Servir archivos del cliente
app.use(express.static(path.join(__dirname, '../client')));

// Variables globales
let hostId = null;
let drawingEnabled = true;
let audioEnabled = true;

io.on('connection', socket => {
  console.log('🔗 Usuario conectado:', socket.id);

  // Asignar rol
  if (!hostId) {
    hostId = socket.id;
    socket.emit('role', 'host');
  } else {
    socket.emit('role', 'guest');
  }

  // Notificar a otros que hay un nuevo usuario (para WebRTC)
  socket.broadcast.emit('new-user', socket.id);

  // 🎨 Dibujo colaborativo (canvas)
  socket.on('drawLine', data => {
    if (drawingEnabled || socket.id === hostId) {
      socket.broadcast.emit('remoteDrawLine', data);
    }
  });

  socket.on('drawRect', data => {
    if (drawingEnabled || socket.id === hostId) {
      socket.broadcast.emit('remoteDrawRect', data);
    }
  });

  socket.on('drawCircle', data => {
    if (drawingEnabled || socket.id === hostId) {
      socket.broadcast.emit('remoteDrawCircle', data);
    }
  });

  // 🔒 Control de dibujo
  socket.on('toggleDrawing', enabled => {
    if (socket.id === hostId) {
      drawingEnabled = enabled;
      io.emit('drawingStatus', enabled);
    }
  });

  // 🔇 Control de audio
  socket.on('toggleAudio', enabled => {
    if (socket.id === hostId) {
      audioEnabled = enabled;
      io.emit('audioStatus', enabled);
    }
  });

  // 🔁 Señalización WebRTC
  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // ❌ Desconexión
  socket.on('disconnect', () => {
    console.log('🔴 Usuario desconectado:', socket.id);

    if (socket.id === hostId) {
      console.log('🛑 El host ha salido. Finalizando sesión...');
      hostId = null;
      io.emit('sessionEnded');
    }

    socket.broadcast.emit('user-disconnected', socket.id);
  });
});

// Lanzar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
