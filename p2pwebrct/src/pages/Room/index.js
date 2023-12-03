import { useParams } from "react-router";
import useWebRTC from "../../hooks/useWebRTC";

export default function Room() {
    //витягаємо ід з хука useParams
    const {id: roomID} = useParams();

    useWebRTC(roomID);
    console.log(roomID);

   return (
    <div>
        Room
    </div>
   ); 
}