const socket = io();
let username = '';

while (!username) {
  username = prompt('Ingresa tu nombre para el chat:').trim();
}
socket.emit('setUsername', username);

// Roles
socket.on('role', role => {
  isHost = role === 'host';
  if (isHost) {
    hostControls.style.display = 'block';
    alert('🎓 Eres el anfitrión');
  } else {
    alert('👤 Eres un participante');
  }
});

// Estado de dibujo y sesión
socket.on('drawingStatus', enabled => {
  canDraw = enabled;
  if (!enabled && !isHost) alert('✋ El anfitrión ha desactivado el dibujo');
});

socket.on('audioStatus', enabled => {
  if (!enabled && !isHost) alert('🔇 El anfitrión ha desactivado el audio');
});

socket.on('sessionEnded', () => {
  alert('🛑 El anfitrión finalizó la sesión');
  location.reload();
});

// Dibujo remoto
socket.on('remoteDrawLine', d => drawLine(d.x1, d.y1, d.x2, d.y2, d.color, d.width, false));
socket.on('remoteDrawRect', d => drawRect(d.x, d.y, d.w, d.h, d.color, d.width, false));
socket.on('remoteDrawCircle', d => drawCircle(d.x1, d.y1, d.x2, d.y2, d.color, d.width, false));
socket.on('clearBoard', () => ctx.clearRect(0, 0, canvas.width, canvas.height));

// Chat de texto
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
document.getElementById('sendChat').onclick = () => {
  const msg = chatInput.value.trim();
  if (msg) {
    socket.emit('chatMessage', { username, message: msg });
    chatInput.value = '';
  }
};

socket.on('chatMessage', ({ username, message }) => {
  const msgDiv = document.createElement('div');
  msgDiv.innerHTML = `<strong>${username}:</strong> ${message}`;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
