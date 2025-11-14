import { sessionManager } from '../session/sessionManager';
import { db } from '../database/dataBase';

export const broadcastUpdateRoom = () => {
  const rooms = db.getRooms();
  const message = JSON.stringify({
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0
  });

  broadcastToAll(message);
};

export const broadcastUpdateWinners = () => {
  const winners = db.getAllPlayers()
    .filter(player => player.wins > 0)
    .map(player => ({
      name: player.name,
      wins: player.wins
    }));

  const message = JSON.stringify({
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: 0
  });

  broadcastToAll(message);
};

export const broadcastToAll = (message: string) => {
  const allSockets = sessionManager.getAllSockets();
  allSockets.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
};

export const sendToPlayer = (playerIndex: number, message: string) => {
  const ws = sessionManager.getSocket(playerIndex);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(message);
  }
};