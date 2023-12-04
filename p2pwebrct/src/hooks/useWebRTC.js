import {useEffect, useRef, useCallback } from "react";
import useStateWithCallback from "./useStateWithCallback";
import ACTIONS from "../socket/actions";
import socket from "../socket";

import freeice from 'freeice';

export const LOCAL_VIDEO = 'LOCAL_VIDEO';

export default function useWebRTC(roomID){
    const [clients, updateClients] = useStateWithCallback([]); //дані про клієнти

    //додає клієнта, якщо його ще немає в кімнаті
    const addNewClient = useCallback((newClient, cb) => {
        if (!clients.includes(newClient)) {
            updateClients(list => [...list, newClient], cb);
        }
    }, [clients, updateClients]); 

    const peerConnections = useRef({}); //користувацькі конекшени
    const localMediaStream = useRef(null); //трансляція даних з камери і аудіо
    const peerMediaElements = useRef({
        [LOCAL_VIDEO]: null,
    }); //посилання на всі відео елемент на сторінці


    //для додавання нового користувача
    useEffect(() => {
        async function handleNewPeer(peerID, createOffer) {
            if (peerID in peerConnections.current) { //перевірка чи вже підключено
                return console.warn (`Already connected to peer ${peerID}`);
            }
            peerConnections.current[peerID] = new RTCPeerConnection({
                iceServers: freeice(),
            });

            peerConnections.current[peerID].onicecandidate =  event => {
                if (event.candidate) {
                    socket.emit(ACTIONS.RELAY_ICE, {
                        peerID,
                        iceCandidate: event.candidate,
                    });
                }
            }

            let tracksNumber = 0;

            //трансляція відео нового користувача
            peerConnections.current[peerID].ontrack = ({streams: [remoteStream]}) => {
                tracksNumber++
                
                if (tracksNumber === 2) { // якщо є і відео і аудіо
                    tracksNumber = 0;
                
                addNewClient(peerID, () =>{
                    peerMediaElements.current[peerID].srcObject = remoteStream;
                });
            }
        }
        //додається контент, що буде відправлятися
        localMediaStream.current.getTracks().forEach(track => {
            peerConnections.current[peerID].addTrack(track, localMediaStream.current);
        });

        if (createOffer) {
            const offer = await peerConnections.current[peerID].createOffer();

            await peerConnections.current[peerID].setLocalDescription(offer);
            //відправка контенту
            socket.emit(ACTIONS.RELAY_SDP, {
                peerID,
                sessionDescription: offer,
            });
        }
    }
        socket.on(ACTIONS.ADD_PEER, handleNewPeer);
        return () => {
            socket.off(ACTIONS.ADD_PEER);
          }
    }, []);

    //реагує на нову сесію
    useEffect(() => {
        async function setRemoteMedia({peerID, sessionDescription: remoteDescription}) {
            await peerConnections.current[peerID].setRemoteDescription(
                new RTCSessionDescription(remoteDescription)
            );

            if (remoteDescription.type === 'offer'){
                const answer = await peerConnections.current[peerID].createAnswer();

                await peerConnections.current[peerID].setLocalDescription(answer);

                socket.emit(ACTIONS.RELAY_SDP, {
                    peerID,
                    sessionDescription: answer,
                });
            }
        }
        socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia)
            return () => {
      socket.off(ACTIONS.SESSION_DESCRIPTION);
    }
    }, []);

    //реагує на нового кандидата
    useEffect( () => {
        socket.on(ACTIONS.ICE_CANDIDATE, ({peerID, iceCandidate}) => {
            peerConnections.current[peerID].addIceCandidate(
                new RTCIceCandidate(iceCandidate)
            );
        });

    })
    //видалення контенту при виході з кімнати
    useEffect(() => {
        socket.on(ACTIONS.REMOVE_PEER, ({peerID}) => {
            if (peerConnections.current[peerID]){
                peerConnections.current[peerID].close();
            }

            delete peerConnections.current[peerID];
            delete peerMediaElements.current[peerID];

            updateClients(list => localMediaStream.filter( c => c !== peerID));

        });
    }, []);


    //для виводу власного зображення
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

    //вихід з кімнати
    return () => {
        if (localMediaStream.current) {
            localMediaStream.current.getTracks().forEach(track => track.stop());
        }
        socket.emit(ACTIONS.LEAVE);
    };
    

    }, [roomID]);

    const provideMediaRef = useCallback((id, node) => {
        peerMediaElements.current[id] = node;
    }, []);

    return {
        clients,
        provideMediaRef
    };

}
