import { sessionManager } from "../session/sessionManager";
import { db } from "../database/dataBase";
import { Room, Player } from "../types/types";
import { WebSocket } from "ws";

export const broadcastUpdateRoom = (): void => {
  const rooms = db.getRooms();
  const message = createMessage("update_room", rooms);
  broadcastToAll(message);
};

export const broadcastUpdateWinners = (): void => {
  const winners = db
    .getAllPlayers()
    .filter((player: Player) => player.wins > 0)
    .map((player: Player) => ({
      name: player.name,
      wins: player.wins,
    }));

  const message = createMessage("update_winners", winners);
  broadcastToAll(message);
};

export const broadcastToAll = (message: string): void => {
  const allSockets = sessionManager.getAllSockets();
  allSockets.forEach((ws: WebSocket) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
};

export const sendToPlayer = (playerIndex: number, message: string): void => {
  const ws = sessionManager.getSocket(playerIndex);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(message);
  }
};

const createMessage = (type: string, data: any): string => {
  return JSON.stringify({
    type,
    data: JSON.stringify(data),
    id: 0,
  });
};
