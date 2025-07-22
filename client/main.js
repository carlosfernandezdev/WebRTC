const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

let painting = false;
let currentTool = 'pencil';
let startX, startY;
let strokeColor = '#000';
let lineWidth = 2;

// Selectores
document.getElementById('pencil').onclick = () => currentTool = 'pencil';
document.getElementById('eraser').onclick = () => currentTool = 'eraser';
document.getElementById('rectangle').onclick = () => currentTool = 'rectangle';
document.getElementById('circle').onclick = () => currentTool = 'circle';

document.getElementById('colorPicker').oninput = e => strokeColor = e.target.value;
document.getElementById('thickness').oninput = e => lineWidth = e.target.value;

// Controles del host
const hostControls = document.getElementById('hostControls');
const toggleDraw = document.getElementById('toggleDraw');
const toggleAudio = document.getElementById('toggleAudio');

let drawState = true;
let audioState = true;

toggleDraw.onclick = () => {
  drawState = !drawState;
  socket.emit('toggleDrawing', drawState);
  toggleDraw.textContent = drawState ? '🔒 Bloquear dibujo' : '🔓 Permitir dibujo';
};

toggleAudio.onclick = () => {
  audioState = !audioState;
  socket.emit('toggleAudio', audioState);
  toggleAudio.textContent = audioState ? '🔇 Bloquear micrófonos' : '🔊 Permitir micrófonos';
};

// Canvas listeners
canvas.addEventListener('mousedown', e => {
  if (!window.isHost && !window.canDraw) {
    console.log('⛔ Bloqueado: no puedes dibujar');
    return;
  }

  painting = true;
  startX = e.offsetX;
  startY = e.offsetY;
  if (currentTool === 'pencil' || currentTool === 'eraser') {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
  }
});

canvas.addEventListener('mousemove', e => {
  if (!painting || (!window.isHost && !window.canDraw)) return;

  const x = e.offsetX;
  const y = e.offsetY;

  if (currentTool === 'pencil') {
    drawLine(startX, startY, x, y, strokeColor, lineWidth);
    startX = x;
    startY = y;
  }

  if (currentTool === 'eraser') {
    drawLine(startX, startY, x, y, '#ffffff', 10);
    startX = x;
    startY = y;
  }
});

canvas.addEventListener('mouseup', e => {
  if (!window.isHost && !window.canDraw) return;
  painting = false;
  const endX = e.offsetX;
  const endY = e.offsetY;

  if (currentTool === 'rectangle') {
    drawRect(startX, startY, endX - startX, endY - startY, strokeColor, lineWidth);
  }

  if (currentTool === 'circle') {
    drawCircle(startX, startY, endX, endY, strokeColor, lineWidth);
  }
});

// Funciones de dibujo
function drawLine(x1, y1, x2, y2, color, width, emit = true) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (emit) socket.emit('drawLine', { x1, y1, x2, y2, color, width });
}

function drawRect(x, y, w, h, color, width, emit = true) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.strokeRect(x, y, w, h);

  if (emit) socket.emit('drawRect', { x, y, w, h, color, width });
}

function drawCircle(x1, y1, x2, y2, color, width, emit = true) {
  const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  ctx.beginPath();
  ctx.arc(x1, y1, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();

  if (emit) socket.emit('drawCircle', { x1, y1, x2, y2, color, width });
}
const clearBoardBtn = document.getElementById('clearBoard');

clearBoardBtn.onclick = () => {
  if (!window.isHost) return;

  clearCanvas(); // limpiar local
  socket.emit('clearBoard'); // notificar a todos
};

// Función para limpiar canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');
const chatMessages = document.getElementById('chatMessages');

sendChat.onclick = () => {
  const msg = chatInput.value.trim();
  if (msg) {
    socket.emit('chatMessage', msg);
    chatInput.value = '';
  }
};

socket.on('chatMessage', msg => {
  const div = document.createElement('div');
  div.textContent = msg;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
toggleAudio.onclick = () => {
  audioState = !audioState;
  socket.emit('toggleAudio', audioState);
  toggleAudio.textContent = audioState ? '🔇 Bloquear micrófonos' : '🔊 Permitir micrófonos';
};

