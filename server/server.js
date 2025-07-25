const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const socketio = require('socket.io');

// Rutas de los certificados SSL
const options = {
  key: fs.readFileSync(path.join(__dirname, 'local-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'local-cert.pem'))
};

const app = express();
const server = https.createServer(options, app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, '../client')));

let hostId = null;
let drawingEnabled = true;
let audioEnabled = true;

// Mapa para almacenar nombres de usuario por socket.id
const users = {};

io.on('connection', socket => {
  console.log('🔗 Usuario conectado:', socket.id);

  // Asignar rol
  if (!hostId) {
    hostId = socket.id;
    socket.emit('role', 'host');
  } else {
    socket.emit('role', 'guest');
  }

  // Guardar nombre de usuario
  socket.on('setUsername', username => {
    users[socket.id] = username || 'Anónimo';
  });

  // Eventos de dibujo
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

  // Controles del host
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

  // Chat de texto
  socket.on('chatMessage', ({ message }) => {
    const username = users[socket.id] || 'Anónimo';
    io.emit('chatMessage', { username, message });
  });

  // WebRTC señalización
  socket.on('offer', offer => socket.broadcast.emit('offer', offer));
  socket.on('answer', answer => socket.broadcast.emit('answer', answer));
  socket.on('ice-candidate', candidate => socket.broadcast.emit('ice-candidate', candidate));

  // Desconexión
  socket.on('disconnect', () => {
    if (socket.id === hostId) {
      console.log('🛑 Host desconectado');
      hostId = null;
      io.emit('sessionEnded');
    }
    delete users[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor activo en https://192.168.0.110:${PORT}`);
});
