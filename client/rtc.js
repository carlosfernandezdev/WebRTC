let localStream = null;
let peerConnection = null;

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// ✅ Esperar a que DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  socket.on('audioStatus', async (enabled) => {
    if (enabled && !peerConnection) {
      await createConnection(true);
    }
  });

  socket.on('offer', async (offer) => {
    if (!peerConnection) {
      await createConnection(false, offer);
    }
  });

  socket.on('answer', async (answer) => {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  });

  socket.on('ice-candidate', async (candidate) => {
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('❌ Error añadiendo ICE candidate:', err);
      }
    }
  });
});

// 🔧 Función robusta
async function createConnection(isOfferer, remoteOffer = null) {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Este navegador no permite acceso al micrófono (usa HTTPS o localhost)");
      return;
    }

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
      const audio = document.createElement('audio');
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      document.body.appendChild(audio);
    };

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

  } catch (err) {
    console.error("❌ Error creando conexión WebRTC:", err);
    alert("No se pudo acceder al micrófono. Verifica los permisos del navegador.");
  }
}
