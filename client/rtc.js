let localStream;
let peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// Host decide si habilita audio
socket.on('audioStatus', async (enabled) => {
  if (!enabled) return;

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = e => {
    if (e.candidate) socket.emit('ice-candidate', e.candidate);
  };

  peerConnection.ontrack = e => {
    const audio = document.createElement('audio');
    audio.srcObject = e.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer);
});

// Recibir señales
socket.on('offer', async (offer) => {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = e => {
    if (e.candidate) socket.emit('ice-candidate', e.candidate);
  };

  peerConnection.ontrack = e => {
    const audio = document.createElement('audio');
    audio.srcObject = e.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', async (candidate) => {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (e) {
    console.error('Error ICE:', e);
  }
});
