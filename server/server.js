const express = require('express');
const http = require('http');
const path = require('path');
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

  if (!hostId) {
    hostId = socket.id;
    socket.emit('role', 'host');
  } else {
    socket.emit('role', 'guest');
  }

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

  socket.on('clearBoard', () => {
    if (socket.id === hostId) {
      io.emit('clearBoard');
    }
  });

  socket.on('offer', offer => socket.broadcast.emit('offer', offer));
  socket.on('answer', answer => socket.broadcast.emit('answer', answer));
  socket.on('ice-candidate', candidate => socket.broadcast.emit('ice-candidate', candidate));

  socket.on('disconnect', () => {
    if (socket.id === hostId) {
      console.log('🛑 Host desconectado');
      hostId = null;
      io.emit('sessionEnded');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
