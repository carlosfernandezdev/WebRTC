let localStream = null;
let peerConnection = null;
const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};
document.getElementById('testMicBtn').onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const micBar = document.getElementById('micLevel');

    function updateMicLevel() {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      const level = Math.min(100, Math.floor((avg / 256) * 100));
      micBar.style.width = `${level}%`;
      requestAnimationFrame(updateMicLevel);
    }

    updateMicLevel();

    alert('Micrófono funcionando. Habla para ver el nivel de audio.');

  } catch (err) {
    console.error('🎤 Error al probar el micrófono:', err);
    alert('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
  }
};

// ✅ Función para crear y configurar la conexión WebRTC
async function createConnection(isOfferer, remoteOffer = null) {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    peerConnection = new RTCPeerConnection(config);

    // 🔁 Enviar audio local
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // 🎧 Recibir audio remoto
    peerConnection.ontrack = (event) => {
      const audio = document.createElement('audio');
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      document.body.appendChild(audio);
    };

    // 📡 Reenviar candidatos ICE
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    if (isOfferer) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', offer);
    } else {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(remoteOffer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', answer);
    }

  } catch (error) {
    console.error('❌ Error creando conexión WebRTC:', error);
    alert('Error accediendo al micrófono o creando la conexión WebRTC');
  }
}

// 🟢 El host activa el audio
socket.on('audioStatus', async (enabled) => {
  if (enabled && !peerConnection) {
    await createConnection(true); // actúa como offerer
  }
});

// 🟡 Recibir oferta y responder (invitado)
socket.on('offer', async (offer) => {
  if (!peerConnection) {
    await createConnection(false, offer);
  }
});

// 🟠 Recibir respuesta (host)
socket.on('answer', async (answer) => {
  if (peerConnection) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }
});

// 🔵 ICE Candidate recibido
socket.on('ice-candidate', async (candidate) => {
  if (peerConnection) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('❌ Error añadiendo ICE candidate:', err);
    }
  }
});
