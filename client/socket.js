const socket = io();

// Variables globales compartidas
window.isHost = false;
window.canDraw = true;

socket.on('role', role => {
  if (role === 'host') {
    window.isHost = true;
    window.canDraw = true; // 🔐 El host siempre puede dibujar
    hostControls.style.display = 'block';
    console.log('✅ Rol asignado: HOST');
    alert('🎓 Eres el anfitrión');
  } else {
    window.isHost = false;
    console.log('✅ Rol asignado: GUEST');
    alert('👤 Eres un participante');
  }
});

socket.on('drawingStatus', enabled => {
  if (!window.isHost) {
    window.canDraw = enabled;
    if (!enabled) alert('✋ El anfitrión ha desactivado el dibujo');
    else alert('✅ El anfitrión ha activado el dibujo');
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
socket.on('clearBoard', () => {
  clearCanvas(); // limpiar canvas cuando el host lo indica
});
