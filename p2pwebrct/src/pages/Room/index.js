import React from 'react';
import { useParams } from 'react-router';
import useWebRTC, { LOCAL_VIDEO } from '../../hooks/useWebRTC';

export default function Room() {
  const { id: roomID } = useParams();
  const { clients, provideMediaRef } = useWebRTC(roomID);

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      {clients.map((clientID) => (
        <div key={clientID} style={{ flex: 1 }}>
          <video
            ref={(instance) => {
              provideMediaRef(clientID, instance);
            }}
            autoPlay
            playsInline
            muted={clientID === LOCAL_VIDEO}
          />
        </div>
      ))}
    </div>
  );
}
