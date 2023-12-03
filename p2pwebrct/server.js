const path = require('path');
const express = require('express');
const ACTIONS = require('./src/socket/actions');
const { config } = require('process');
const app = express();

const server = require('http').createServer(app); //створення серверу
const io = require('socket.io')(server); //підключаємо сокет

const PORT = process.env.PORT || 3000; //переданий порт або 3000

//дістати всі існуючі кімнати
function getClientRooms() {
    const {rooms} = io.sockets.adapter;
    return Array.from(rooms.keys())
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
        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []); 
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
        const clients = Array.from(io.sockets.adapter.get(roomID) || []);


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

    //console.log('Socket connected');
});

server.listen(PORT, () => {
    console.log('Server started successfully')
})
