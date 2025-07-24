const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, '../client')));

let hostId = null;
let drawingEnabled = true;
let audioEnabled = true;

io.on('connection', socket => {
  console.log('🔗 Usuario conectado:', socket.id);

  // 🎓 Asignar rol de host
  if (!hostId) {
    hostId = socket.id;
    socket.emit('role', 'host');
  } else {
    socket.emit('role', 'guest');
  }

  // 💬 Chat de texto
  socket.on('chatMessage', msg => {
    io.emit('chatMessage', msg);
  });

  // 🔈 Señalización WebRTC
  socket.on('offer', data => socket.broadcast.emit('offer', data));
  socket.on('answer', data => socket.broadcast.emit('answer', data));
  socket.on('ice-candidate', data => socket.broadcast.emit('ice-candidate', data));

  // 🧽 Limpiar pizarra (solo el host)
  socket.on('clearBoard', () => {
    if (socket.id === hostId) {
      io.emit('clearBoard');
    }
  });

  // ✅ Función auxiliar para emitir eventos de dibujo
  const emitDraw = (event, data) => {
    if (socket.id === hostId) {
      io.emit(event, data); // todos, incluyendo host
    } else {
      socket.broadcast.emit(event, data); // todos menos él
    }
  };

  // 🖌 Eventos de dibujo
  socket.on('drawLine', data => {
    if (drawingEnabled || socket.id === hostId) {
      emitDraw('remoteDrawLine', data);
    }
  });

  socket.on('drawRect', data => {
    if (drawingEnabled || socket.id === hostId) {
      emitDraw('remoteDrawRect', data);
    }
  });

  socket.on('drawCircle', data => {
    if (drawingEnabled || socket.id === hostId) {
      emitDraw('remoteDrawCircle', data);
    }
  });

  // 🔒 Controles del host
  socket.on('toggleDrawing', enabled => {
    if (socket.id === hostId) {
      drawingEnabled = enabled;
      io.emit('drawingStatus', enabled);
    }
  });

  socket.on('toggleAudio', enabled => {
    if (socket.id === hostId) {
      audioEnabled = enabled;
      io.emit('audioStatus', enabled);
    }
  });

  // ❌ Desconexión
  socket.on('disconnect', () => {
    if (socket.id === hostId) {
      console.log('🛑 El host ha salido. Cerrando sesión...');
      hostId = null;
      io.emit('sessionEnded');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
