/**
 * ARENA CLASH — Message Protocol
 * 
 * Defines all WebSocket message types used between client and server.
 * This serves as documentation and can be used for future binary serialization.
 */

/**
 * Client → Server messages
 */
export const CLIENT_MESSAGES = {
    JOIN: 'player:join',           // { nickname, character }
    INPUT: 'player:input',         // { seq, dx, dy, attack, attackAngle }
    PING: 'ping:check',            // timestamp
};

/**
 * Server → Client messages
 */
export const SERVER_MESSAGES = {
    JOIN_SUCCESS: 'join:success',     // { id, x, y, hp, maxHp, character, ... }
    JOIN_ERROR: 'join:error',         // { message }
    STATE_UPDATE: 'state:update',     // { tick, timestamp, lastInput, players, projectiles }
    PLAYER_JOINED: 'player:joined',   // { id, x, y, hp, maxHp, char, nick }
    PLAYER_LEFT: 'player:left',       // { id, nickname }
    PLAYER_RESPAWN: 'player:respawn', // { id, x, y, hp }
    PING_RESPONSE: 'ping:response',   // timestamp
};

export default { CLIENT_MESSAGES, SERVER_MESSAGES };
