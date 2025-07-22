const peers = {}; // conexiones P2P por id de socket
let localStream = null;
let isMicAllowed = true; // se gestiona desde socket.io

navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(stream => {
    localStream = stream;
  })
  .catch(err => {
    alert('Error accediendo al micrófono: ' + err.message);
  });

socket.on('audioStatus', enabled => {
  isMicAllowed = enabled;
  if (!enabled) {
    alert('🔇 El anfitrión bloqueó los micrófonos');
    stopAudio();
  } else {
    alert('🔊 El anfitrión activó los micrófonos');
    startAudio();
  }
});

// Emitir oferta al conectarse
socket.on('new-user', socketId => {
  if (!localStream || !isMicAllowed) return;

  const peer = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

  peer.onicecandidate = e => {
    if (e.candidate) {
      socket.emit('ice-candidate', { to: socketId, candidate: e.candidate });
    }
  };

  peer.ontrack = event => {
    const audio = document.createElement('audio');
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  peer.createOffer().then(offer => {
    peer.setLocalDescription(offer);
    socket.emit('offer', { to: socketId, offer });
  });

  peers[socketId] = peer;
});

// Recibir oferta
socket.on('offer', ({ from, offer }) => {
  if (!localStream || !isMicAllowed) return;

  const peer = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

  peer.onicecandidate = e => {
    if (e.candidate) {
      socket.emit('ice-candidate', { to: from, candidate: e.candidate });
    }
  };

  peer.ontrack = event => {
    const audio = document.createElement('audio');
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  peer.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
    return peer.createAnswer();
  }).then(answer => {
    peer.setLocalDescription(answer);
    socket.emit('answer', { to: from, answer });
  });

  peers[from] = peer;
});

// Recibir respuesta
socket.on('answer', ({ from, answer }) => {
  peers[from]?.setRemoteDescription(new RTCSessionDescription(answer));
});

// ICE candidate
socket.on('ice-candidate', ({ from, candidate }) => {
  peers[from]?.addIceCandidate(new RTCIceCandidate(candidate));
});

// Limpiar peer al desconectar
socket.on('user-disconnected', id => {
  if (peers[id]) {
    peers[id].close();
    delete peers[id];
  }
});

// Funciones de control
function stopAudio() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
}

function startAudio() {
  if (!localStream) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      localStream = stream;
    });
  }
}
