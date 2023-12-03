const ACTIONS = {
    JOIN: 'join',
    LEAVE: 'leave',
    SHARE_ROOMS: 'share-rooms',

    ADD_PEER: 'add-peer', //створення нового звязку між клієнтами
    REMOVE_PEER: 'remove-peer',

    RELAY_SDP: 'relay-sdp', //передача медіа дати
    RELAY_ICE: 'relay-ice', //передача фізичних підключень від ice-candidate
    ICE_CANDIDATE: 'ice-candidate',

    SESSION_DESCRIPTION: 'session-description'
};

module.exports = ACTIONS;