const path = require('path');
const express = require('express');
const ACTIONS = require('./src/socket/actions');
const { config } = require('process');
const app = express();
const {version, validate} = require('uuid');

const server = require('http').createServer(app); //створення серверу
const io = require('socket.io')(server); //підключаємо сокет

const PORT = process.env.PORT || 3000; //переданий порт або 3000

//дістати всі існуючі кімнати, які створювали клієнти
function getClientRooms() {
    const {rooms} = io.sockets.adapter;
    return Array.from(rooms.keys()).filter(roomID => validate(roomID) && version(roomID) === 4);
}

//інформування користувачів
function shareRoomsInfo(){
    io.emit(ACTIONS.SHARE_ROOMS, {
        rooms: getClientRooms()
    })
}

//звязуємо клієнт з сервером
io.on('connection', socket =>{
    shareRoomsInfo();
    socket.on(ACTIONS.JOIN, config =>{
        const{room: roomID} = config;
        const {rooms: joinedRooms} = socket; 
        //перевірка, щоб не підєднатися повторно в кімнату
        if (Array.from(joinedRooms).includes(roomID)){
            return console.warn(`User already joined to this room ${roomID}`);    
        }

        //Додавання в кімнату
        const clients = Array.from(io.sockets.adapter.rooms[roomID] || []); 
        clients.forEach(clientID => {
            io.to(clientID).emit(ACTIONS.ADD_PEER, {
                peerID: socket.id,
                createOffer: false
            });

            socket.emit(ACTIONS.ADD_PEER, {
                peerID: clientID,
                createOffer: true, //створюється з клієнтом, що заходить в кімнату
            });
        });

        socket.join(roomID); //підключення до кімнати
        shareRoomsInfo(); //iнформація про зміни в кімнатах
    });

    //Вихід з кімнати
   function leaveRoom() {
    const {rooms} = socket;

    Array.from(rooms).forEach(roomID => {
        const clients = Array.from(io.sockets.adapter[roomID] || []);


        //інформування учасників про вихід учасника
        clients.forEach(clientID => {
            io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
                peerID: socket.id,
            });

            socket.emit(ACTIONS.REMOVE_PEER, {
                peerID: clientID,
            });
        });
        //Відключення користувача, що хоче відключитися
        socket.leave(roomID)
    });
    shareRoomsInfo();
   }

   socket.on(ACTIONS.LEAVE, leaveRoom);
   socket.on('disconnecting', leaveRoom);

   //посилає на сокет інформацію про нову сесію
   socket.on(ACTIONS.RELAY_SDP, ({peerID, sessionDescription}) => {
    io.to(peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
        peerID: socket.id, 
        sessionDescription,
    });
   });
   //посилає на сокет інформацію про нового клієнта
   socket.on(ACTIONS.RELAY_ICE, ({peerID, iceCandidate}) => {
    io.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
        peerID: socket.id,
        iceCandidate,
    });
   });

    //console.log('Socket connected');
});

server.listen(PORT, () => {
    console.log('Server started successfully')
})
