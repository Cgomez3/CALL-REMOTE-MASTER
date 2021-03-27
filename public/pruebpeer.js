

const iceServers = {
    'iceServer': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' },
        { 'urls': 'stun:stun1.l.google.com:19302' },
        { 'urls': 'stun:stun2.l.google.com:19302' },
        { 'urls': 'stun:stun3.l.google.com:19302' },
        { 'urls': 'stun:stun4.l.google.com:19302' },
        { 'urls': 'stun:stun01.sipphone.com' },
        { 'urls': 'stun:stun.ekiga.net' },
        { 'urls': 'stun:stun.fwdnet.net' },
        { 'urls': 'stun:stun.ideasip.com' },
        { 'urls': 'stun:stun.iptel.org' },
        { 'urls': 'stun:stun.rixtelecom.se' },
        { 'urls': 'stun:stun.schlund.de' },
        { 'urls': 'stun:stunserver.org' },
        { 'urls': 'stun:stun.softjoys.com' },
        { 'urls': 'stun:stun.voiparound.com' },
        { 'urls': 'stun:stun.voipbuster.com' },
        { 'urls': 'stun:stun.voipstunt.com' },
        { 'urls': 'stun:stun.voxgratia.org' },
        { 'urls': 'stun:stun.xten.com' },
    ]
};

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

const video1 = document.querySelector('video#video1');
const video2 = document.querySelector('video#video2');
const video3 = document.querySelector('video#video3');
const socket = io();

let pc1Local;
let pc1Remote;
let pc2Local;
let pc2Remote;
const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
};
let localStream, isCall;
function gotStream(stream, call, data) {
    console.log('Received local stream');
    video1.srcObject = stream;
    localStream = stream;
    isCall = call;
    console.log('se conecto= ', isCall, data)
    callButton.disabled = false;
}

function start() {
    socket.emit('crear y unir', { usuario: 'cristhian', room: 'clase1' })
}

socket.on('creado', (dada) => {
    console.log(dada.usuario)
    startButton.disabled = true;
    navigator.mediaDevices
        .getUserMedia({
            audio: true,
            video: true
        })
        .then((stream) => {
            gotStream(stream, false, dada);
        })
        .catch(e => console.log('getUserMedia() error: ', e));
})

socket.on('unira a la sala', (dada) => {
    console.log(dada.usuario)
    startButton.disabled = true;
    navigator.mediaDevices
        .getUserMedia({
            audio: true,
            video: true
        })
        .then((stream) => {
            gotStream(stream, true, dada);
        })
        .catch(e => console.log('getUserMedia() error: ', e));

})

function call() {
    callButton.disabled = true;
    hangupButton.disabled = false;
    console.log('call=', isCall)
    if (isCall) {
        socket.emit('ready', { usuario: 'jose', room: 'clase1' })
    }
    /*console.log('Starting calls');
    const audioTracks = window.localStream.getAudioTracks();
    const videoTracks = window.localStream.getVideoTracks();
    if (audioTracks.length > 0) {
      console.log(`Using audio device: ${audioTracks[0].label}`);
    }
    if (videoTracks.length > 0) {
      console.log(`Using video device: ${videoTracks[0].label}`);
    }
    // Create an RTCPeerConnection via the polyfill.
    const servers = null;*/
    /*======================================================================
    pc1Local = new RTCPeerConnection(iceServers);
    pc1Local.onicecandidate = iceCallback1Local;

    pc1Remote = new RTCPeerConnection(iceServers);
    pc1Remote.ontrack = gotRemoteStream1;
    pc1Remote.onicecandidate = iceCallback1Remote;

    window.localStream.getTracks().forEach(track => pc1Local.addTrack(track, window.localStream));
    console.log('Adding local stream to pc1Local');
    pc1Local
        .createOffer(offerOptions)
        .then(gotDescription1Local, onCreateSessionDescriptionError);
--------------------------------------------------------------------------------*/
    /*console.log('pc1: created local and remote peer connection objects');
  
    pc2Local = new RTCPeerConnection(servers);
    pc2Remote = new RTCPeerConnection(servers);
    pc2Remote.ontrack = gotRemoteStream2;
    pc2Local.onicecandidate = iceCallback2Local;
    pc2Remote.onicecandidate = iceCallback2Remote;
    console.log('pc2: created local and remote peer connection objects');
  
    
  
    window.localStream.getTracks().forEach(track => pc2Local.addTrack(track, window.localStream));
    console.log('Adding local stream to pc2Local');
    pc2Local.createOffer(offerOptions)
        .then(gotDescription2Local, onCreateSessionDescriptionError);*/
}

//usuario remoto
socket.on('ready', (data) => {
    if (isCall) {
        console.log('retorna a ready=', data)
        //iniciamos la conexion entre pares
        pc1Local = new RTCPeerConnection(iceServers);
        //enviamos el candidato de hielo
        pc1Local.onicecandidate = (event) => {
            iceCallback1Local(event, data);
        };
        //en tiempo real insertamos el video
        pc1Local.ontrack=gotRemoteStream1;
        localStream.getTracks().forEach(track => pc1Local.addTrack(track, window.localStream));
        //creamos la oferta
        const sdp= await pc1Local.createOffer(offerOptions);
        pc1Local.setLocalDescription(sdp);

        socket.emit('oferta', {
            type: 'oferta',
            sdp: sdp,
            room: data.room,
            usuario: data.usuario
          });
      
    }
})

function iceCallback1Local(event, data) {
    console.log('candidate', event)
    if (event.candidate) {
        var datos = {
            type: 'candidate',
            candidate: event.candidate,
            lable: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            room: data.room,
            usuario: data.usuario
        }
        socket.emit('candidate', datos);
    }
    //handleCandidate(event.candidate, pc1Remote, 'pc1: ', 'local');
}

socket.on('candidatos', (data) => {
    console.log('candidatos', data)
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: data.lable,
        candidate: data.candidate.candidate,
        sdpMid: data.id,
      });
      
      addCandidate(candidate);
})

async function addCandidate(event){
    await pc1Local.addIceCandidate(event);
}
//usuario local
socket.on('oferta', (data) => {
    if (!isCall) {
        console.log('retorna a oferta=', data)
        //iniciamos la conexion entre pares
        pc1Local = new RTCPeerConnection(iceServers);
        //enviamos el candidato de hielo
        pc1Local.onicecandidate = (event) => {
            iceCallback1Local(event, data);
        };
        //en tiempo real insertamos el video
        pc1Local.ontrack=gotRemoteStream1;
        localStream.getTracks().forEach(track => pc1Local.addTrack(track, window.localStream));
        //creamos la oferta
        pc1Local.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const sdp = await pc1Local.createAnswer();
        pc1Local.setLocalDescription(sdp);
        socket.emit('responder', {
          type: 'responder',
          sdp: sdp,
          room: data.room,
          usuario: data.usuario
        });
      
    }
})


function onCreateSessionDescriptionError(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
}

function gotDescription1Local(desc) {
    pc1Local.setLocalDescription(desc);
    console.log(`Offer from pc1Local\n${desc.sdp}`);
    pc1Remote.setRemoteDescription(desc);
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    pc1Remote.createAnswer().then(gotDescription1Remote, onCreateSessionDescriptionError);
}

function gotDescription1Remote(desc) {
    pc1Remote.setLocalDescription(desc);
    console.log(`Answer from pc1Remote\n${desc.sdp}`);
    pc1Local.setRemoteDescription(desc);
}

function gotDescription2Local(desc) {
    pc2Local.setLocalDescription(desc);
    console.log(`Offer from pc2Local\n${desc.sdp}`);
    pc2Remote.setRemoteDescription(desc);
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    pc2Remote.createAnswer().then(gotDescription2Remote, onCreateSessionDescriptionError);
}

function gotDescription2Remote(desc) {
    pc2Remote.setLocalDescription(desc);
    console.log(`Answer from pc2Remote\n${desc.sdp}`);
    pc2Local.setRemoteDescription(desc);
}

function hangup() {
    console.log('Ending calls');
    pc1Local.close();
    pc1Remote.close();
    pc2Local.close();
    pc2Remote.close();
    pc1Local = pc1Remote = null;
    pc2Local = pc2Remote = null;
    hangupButton.disabled = true;
    callButton.disabled = false;
}

function gotRemoteStream1(e) {
    if (video2.srcObject !== e.streams[0]) {
        video2.srcObject = e.streams[0];
        console.log('pc1: received remote stream');
    }
}

function gotRemoteStream2(e) {
    if (video3.srcObject !== e.streams[0]) {
        video3.srcObject = e.streams[0];
        console.log('pc2: received remote stream');
    }
}



function iceCallback1Remote(event) {
    handleCandidate(event.candidate, pc1Local, 'pc1: ', 'remote');
}

function iceCallback2Local(event) {
    handleCandidate(event.candidate, pc2Remote, 'pc2: ', 'local');
}

function iceCallback2Remote(event) {
    handleCandidate(event.candidate, pc2Local, 'pc2: ', 'remote');
}

function handleCandidate(candidate, dest, prefix, type) {
    dest.addIceCandidate(candidate)
        .then(onAddIceCandidateSuccess, onAddIceCandidateError);
    console.log(`${prefix}New ${type} ICE candidate: ${candidate ? candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess() {
    console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
    console.log(`Failed to add ICE candidate: ${error.toString()}`);
}