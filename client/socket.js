const socket = io();

socket.on('role', role => {
  isHost = role === 'host';
  if (isHost) {
    hostControls.style.display = 'block';
    alert('🎓 Eres el anfitrión');
  } else {
    alert('👤 Eres un participante');
  }
});

socket.on('drawingStatus', enabled => {
  canDraw = enabled;
  if (!enabled && !isHost) {
    alert('✋ El anfitrión ha desactivado el dibujo');
  }
});

socket.on('sessionEnded', () => {
  alert('🛑 El anfitrión finalizó la sesión');
  location.reload();
});

socket.on('clearBoard', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('remoteDrawLine', d => drawLine(d.x1, d.y1, d.x2, d.y2, d.color, d.width, false));
socket.on('remoteDrawRect', d => drawRect(d.x, d.y, d.w, d.h, d.color, d.width, false));
socket.on('remoteDrawCircle', d => drawCircle(d.x1, d.y1, d.x2, d.y2, d.color, d.width, false));
