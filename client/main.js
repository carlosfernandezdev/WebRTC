const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

let drawing = false;
let currentTool = 'pencil';
let startX, startY;
let color = '#000000';
let thickness = 2;
let isHost = false;
let canDraw = true;

// Herramientas
document.getElementById('pencil').onclick = () => currentTool = 'pencil';
document.getElementById('eraser').onclick = () => currentTool = 'eraser';
document.getElementById('rectangle').onclick = () => currentTool = 'rectangle';
document.getElementById('circle').onclick = () => currentTool = 'circle';
document.getElementById('colorPicker').onchange = e => color = e.target.value;
document.getElementById('thickness').oninput = e => thickness = parseInt(e.target.value);

// Host controls
document.getElementById('toggleDraw').onclick = () => {
  canDraw = !canDraw;
  socket.emit('toggleDrawing', canDraw);
  document.getElementById('toggleDraw').textContent = canDraw ? '🔒 Bloquear dibujo' : '🔓 Permitir dibujo';
};

document.getElementById('toggleAudio').onclick = () => {
  audioEnabled = !audioEnabled;
  socket.emit('toggleAudio', audioEnabled);
  document.getElementById('toggleAudio').textContent = audioEnabled ? '🔇 Bloquear micrófonos' : '🔊 Permitir micrófonos';
};

document.getElementById('clearBoard').onclick = () => {
  socket.emit('clearBoard');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

// Posición corregida del mouse
function getMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

// Dibujo
canvas.addEventListener('mousedown', e => {
  if (!canDraw && !isHost) return;
  drawing = true;
  const pos = getMousePos(canvas, e);
  startX = pos.x;
  startY = pos.y;
});

canvas.addEventListener('mouseup', e => {
  if (!canDraw && !isHost) return;
  if (!drawing) return;
  drawing = false;
  const pos = getMousePos(canvas, e);
  const x = pos.x;
  const y = pos.y;

  if (currentTool === 'rectangle') {
    drawRect(startX, startY, x - startX, y - startY, color, thickness, true);
  } else if (currentTool === 'circle') {
    drawCircle(startX, startY, x, y, color, thickness, true);
  }
});

canvas.addEventListener('mousemove', e => {
  if (!drawing || (!canDraw && !isHost)) return;
  const pos = getMousePos(canvas, e);
  const x = pos.x;
  const y = pos.y;

  if (currentTool === 'pencil' || currentTool === 'eraser') {
    const drawColor = currentTool === 'eraser' ? '#ffffff' : color;
    drawLine(startX, startY, x, y, drawColor, thickness, true);
    startX = x;
    startY = y;
  }
});

// Funciones de dibujo locales y remotas
function drawLine(x1, y1, x2, y2, color, width, emit = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.closePath();

  if (emit) {
    socket.emit('drawLine', { x1, y1, x2, y2, color, width });
  }
}

function drawRect(x, y, w, h, color, width, emit = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.strokeRect(x, y, w, h);

  if (emit) {
    socket.emit('drawRect', { x, y, w, h, color, width });
  }
}

function drawCircle(x1, y1, x2, y2, color, width, emit = false) {
  const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.closePath();

  if (emit) {
    socket.emit('drawCircle', { x1, y1, x2, y2, color, width });
  }
}
