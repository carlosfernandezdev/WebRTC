const socket = io();

let isHost = false;
let canDraw = true;

socket.on('role', role => {
  isHost = role === 'host';
  if (isHost) {
    document.getElementById('hostControls').style.display = 'block';
    alert('🎓 Eres el anfitrión');
  } else {
    alert('👤 Eres un participante');
  }
});

socket.on('drawingStatus', enabled => {
  if (!isHost) {
    canDraw = enabled;
    if (!enabled) alert('✋ El anfitrión ha desactivado el dibujo');
  } else {
    canDraw = true; // el host siempre puede dibujar
  }
});

socket.on('sessionEnded', () => {
  alert('🛑 El anfitrión finalizó la sesión');
  location.reload();
});

// Recibir dibujos
socket.on('remoteDrawLine', d => drawLine(d.x1, d.y1, d.x2, d.y2, d.color, d.width, false));
socket.on('remoteDrawRect', d => drawRect(d.x, d.y, d.w, d.h, d.color, d.width, false));
socket.on('remoteDrawCircle', d => drawCircle(d.x1, d.y1, d.x2, d.y2, d.color, d.width, false));
