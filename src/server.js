const express = require('express');
const path = require('path');

const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, '../public'))); // Add that later on

let connectedUsers = [];
let connectedUsers2 = [];

io.on('connection', socket => {
  console.log('A user connected');
  connectedUsers.push(socket.id);
  
  socket.on('crear y unir',(data)=> {
    if(connectedUsers2.length ==0 ){
      connectedUsers2.push(data);
      socket.join(data.room);
      socket.emit('creado',data);
    }else if (connectedUsers2.length > 0){
       data.usuario='jose'
       connectedUsers2.push(data);
       socket.join(data.room);
       socket.emit('unira a la sala',data);
    }
  })

  socket.on('ready',(data)=>{
    console.log('paso reary=',data)
    socket.broadcast.to(data.room).emit('ready',data);
  })

  socket.on('candidate',(data)=>{
    console.log('candidate=',data)
    socket.broadcast.to(data.room).emit('candidatos',data);
  })

  socket.on('oferta',(data)=>{
    console.log('oferta=',data)
    socket.broadcast.to(data.room).emit('oferta',data);
  })

  socket.on('responder',(data)=>{
    console.log('responder=',data)
    socket.broadcast.to(data.room).emit('responder',data);
  })


  socket.broadcast.emit('update-user-list', { userIds: connectedUsers })




  socket.on('disconnect', () => {
    connectedUsers = connectedUsers.filter(user => user !== socket.id)
    socket.broadcast.emit('update-user-list', { userIds: connectedUsers })
  })

  socket.on('mediaOffer', data => {
    socket.to(data.to).emit('mediaOffer', {
      from: data.from,
      offer: data.offer
    });
  });
  
  socket.on('mediaAnswer', data => {
    socket.to(data.to).emit('mediaAnswer', {
      from: data.from,
      answer: data.answer
    });
  });

  socket.on('iceCandidate', data => {
    socket.to(data.to).emit('remotePeerIceCandidate', {
      candidate: data.candidate
    })
  })
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
