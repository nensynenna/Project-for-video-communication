import { useEffect, useState, useRef } from "react";
import socket from "../../socket";
import ACTIONS from "../../socket/actions";
import {v4} from 'uuid';
import {useNavigate} from 'react-router';

export default function Main() {
    const history = useNavigate();
    const [rooms, updateRooms] = useState([]);
    const rootNode = useRef();

    //Підписка на івент SHARE_ROOMS при вході на сторінку
    useEffect( () => {
        socket.on(ACTIONS.SHARE_ROOMS, ({rooms = []} = {}) => {
            if (rootNode.current) {
                updateRooms(rooms);
            }
            updateRooms(rooms); //оновлюємо списком кімнат, коли вони приходять
        });
    }, [])

   return (
    <div ref={rootNode}>
        <h1> Video chat</h1>
        <button onClick={() => {
            history(`/room/${v4()}`);
        }} //при кліку генеруємо ід кімнати та надсилаємо в історію
        >Create New Room</button>
        <p>

        </p>

        <h1> Available Rooms</h1>

        <ul> 
            {rooms.map(roomID => (
                <li key={roomID}>
                    {roomID}
                    <button onClick={() => {
                        history(`/room/${roomID}`); //при кліку записуємо ід кімнати, до якої приєдналися
                    }}
                    >Join Room</button>
                </li>
            ))}
        </ul>
    </div>
   ); 
}