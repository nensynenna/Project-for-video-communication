import {useEffect, useRef, useCallback } from "react";
import useStateWithCallback from "./useStateWithCallback";
import ACTIONS from "../socket/actions";
import socket from "../socket";

export const LOCAL_VIDEO = 'LOCAL_VIDEO';

export default function useWebRTC(roomID){
    const [clients, updateClients] = useStateWithCallback([]); //дані про клієнти

    //додає клієнта, якщо його ще немає в кімнаті
    const addNewClient = useCallback((newClient, cb) => {
        if (!clients.includes(newClient)) {
            updateClients(list => [...list, newClient], cb);
        }
    }, [clients, updateClients]); //////////

    const peerConnections = useRef({}); //користувацькі конекшени
    const localMediaStream = useRef(null); //трансляція даних з камери і аудіо
    const peerMediaElements = useRef({
        [LOCAL_VIDEO]: null,
    }); //посилання на всі відео елемент на сторінці

    ////////


    useEffect(() => {
    //захоплення екрана при вході на сторінку
    async function startCapture() {
        localMediaStream.current = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {
                width: 1280,
                height: 720,
            }
        });
///////////////////
        addNewClient(LOCAL_VIDEO, () => {
            const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];
            //передача захопленого відео і звука на відео елемент на сторінці
            if (localVideoElement) {
                localVideoElement.volume = 0;
                localVideoElement.srcObject = localMediaStream.current;
            }
        } );
    }
    
    startCapture()
    .then(() => socket.emit(ACTIONS.JOIN, {room: roomID}))
    .catch(e => console.error('Error getting userMedia:', e));
    }, [roomID]);

    const provideMediaRef = useCallback((id, node) => {
        peerMediaElements.current[id] = node;
    }, []);

    return {
        clients,
        provideMediaRef
    };

}
