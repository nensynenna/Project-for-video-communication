import {io} from 'socket.io-client';
// створюємо обєкт з налаштуваннями для веб-сокета
const options = {
    "force new connection": true,
    reconnectionAttempts: "Infinity",
    timeout: 10000,
    transports: ["websocket"] //для крос-доменності
}

//створення самого сокета
const socket = io('http://localhost:3000', options);

export default socket;