const callButton = document.querySelector('#call');

let selectedUser;

const createPeerConnection = () => {
  return new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.stunprotocol.org"
      }
    ]
  });
};

let peer = createPeerConnection();
const socket = io('http://localhost:3000');

const onSocketConnect = async () => {
  document.querySelector('#userId').innerHTML = `My user id is ${socket.id}`

  const constraints = {
    audio: false,
    video: true
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  document.querySelector('#localVideo').srcObject = stream;
  stream.getTracks().forEach(track => peer.addTrack(track, stream));
  callButton.disabled = false;
};

const onIceCandidateEvent = event => {
  socket.emit('iceCandidate', {
    to: selectedUser,
    candidate: event.candidate,
  });
};

const onRemotePeerIceCandidate = async (data) => {
  try {
    const candidate = new RTCIceCandidate(data.candidate);
    await peer.addIceCandidate(candidate);
  } catch (error) {
    // Handle error
  }
};

const onUpdateUserList = ({ userIds }) => {
  const usersList = document.querySelector('#usersList');
  const usersToDisplay = userIds.filter(id => id !== socket.id);

  usersList.innerHTML = '';
  
  usersToDisplay.forEach(user => {
    const userItem = document.createElement('div');
    userItem.innerHTML = user;
    userItem.className = 'user-item';
    userItem.addEventListener('click', () => {
      const userElements = document.querySelectorAll('.user-item');
      userElements.forEach((element) => {
        element.classList.remove('user-item--touched');
      })
      userItem.classList.add('user-item--touched');
      selectedUser = user;
    });
    usersList.appendChild(userItem);
  });
};

const onMediaOffer = async (data) => {
  try {
    await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
    const peerAnswer = await peer.createAnswer();
    await peer.setLocalDescription(new RTCSessionDescription(peerAnswer));

    socket.emit('mediaAnswer', {
      answer: peerAnswer,
      from: socket.id,
      to: data.from
    })
  } catch (er) {
    console.log(er)
  }
};

const onMediaAnswer = async (data) => {
  await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
};

const call = async () => {
  callButton.disabled = true;

  const localPeerOffer = await peer.createOffer();

  await peer.setLocalDescription(new RTCSessionDescription(localPeerOffer));
  socket.emit('mediaOffer', {
    offer: localPeerOffer,
    from: socket.id,
    to: selectedUser
  })

};

const gotRemoteStream = (event) => {
  console.log(event)
  const [stream] = event.streams;
  document.querySelector('#remoteVideo').srcObject = stream;
};

// Para comenzar, ambas partes deben obtener los medios de los usuarios, crear una 
// conexión entre pares y agregar pistas a los pares, de modo que los candidatos de ICE se envíen
socket.on('connect', onSocketConnect);
// Intenta agregar candidato remoto
socket.on('remotePeerIceCandidate', onRemotePeerIceCandidate)
// Actualizar lista de usuarios
socket.on('update-user-list', onUpdateUserList);
// Recibir llamada de un usuario
socket.on('mediaOffer', onMediaOffer);
// Recibir respuesta del destinatario de la llamada
socket.on('mediaAnswer', onMediaAnswer);

callButton.addEventListener('click', call);

// Actualice el elemento de video remoto cuando se establezca la conexión entre pares
peer.addEventListener('track', gotRemoteStream);
// Obtiene un posible candidato de ICE y lo envía a otro par
peer.onicecandidate = onIceCandidateEvent;