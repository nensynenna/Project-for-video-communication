const path = require('path');
const express = require('express');
const app = express();

const server = require('http').createServer(app); //створення серверу
const io = require('socket.io')(server); //підключаємо сокет

const PORT = process.env.PORT || 3000; //переданий порт або 3000

//звязуємо клієнт з сервером
io.on('connection', socket =>{
    console.log('Socket connected');
})

server.listen(PORT, () => {
    console.log('Server started successfully')
})
