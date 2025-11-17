import { WebSocket } from "ws";
import { db } from "../database/dataBase";
import { sessionManager } from "../session/sessionManager";
import { broadcastUpdateRoom, sendToPlayer } from "./broadcastHandler";
import { Room, RoomData, User } from "../types/types";
import { sendError, sendSuccess } from "../utils/wsUtils";

export const handleCreateRoom = (ws: WebSocket): void => {
  const playerIndex = sessionManager.getPlayerIndex(ws);

  if (!playerIndex) {
    sendError(ws, "Not authenticated");
    return;
  }

  const player = db.getPlayerByIndex(playerIndex);
  if (!player) {
    sendError(ws, "Player not found");
    return;
  }
  const currentRoom = db.getRoomByPlayerIndex(playerIndex);
  if (currentRoom) {
    db.removeRoom(currentRoom.roomId);
    console.log(`Player ${player.name} left room ${currentRoom.roomId}`);
  }

  const room = db.createRoom(player.name, playerIndex);
  console.log(`Room created: ${room.roomId} by player: ${player.name}`);

  broadcastUpdateRoom();
  sendSuccess(ws, "create_room");
};

export const handleAddUserToRoom = (ws: WebSocket, data: RoomData): void => {
  const { indexRoom } = data;
  const playerIndex = sessionManager.getPlayerIndex(ws);

  if (!playerIndex) {
    sendError(ws, "Not authenticated");
    return;
  }

  const player = db.getPlayerByIndex(playerIndex);
  if (!player) {
    sendError(ws, "Player not found");
    return;
  }
  const targetRoom = db.getRoomById(indexRoom);
  if (targetRoom && targetRoom.roomUsers[0].index === playerIndex) {
    sendError(ws, "Cannot join your own room");
    return;
  }

  const currentRoom = db.getRoomByPlayerIndex(playerIndex);
  if (currentRoom && currentRoom.roomId !== indexRoom) {
    db.removeRoom(currentRoom.roomId);
    console.log(
      `Player ${player.name} left room ${currentRoom.roomId} to join room ${indexRoom}`
    );
  }

  if (currentRoom && currentRoom.roomId === indexRoom) {
    sendSuccess(ws, "add_user_to_room");
    return;
  }

  const room = db.getRoomById(indexRoom);
  if (!room) {
    sendError(ws, "Room not found");
    return;
  }
  const success = db.addPlayerToRoom(indexRoom, player.name, playerIndex);

  if (success) {
    console.log(`Player ${player.name} joined room ${indexRoom}`);

    const updatedRoom = db.getRoomById(indexRoom);
    if (updatedRoom && updatedRoom.roomUsers.length === 2) {
      createGameFromRoom(updatedRoom);
    }

    sendSuccess(ws, "add_user_to_room");
  } else {
    sendError(ws, "Cannot join room - room may be full");
  }
};

const createGameFromRoom = (room: Room): void => {
  const game = db.createGame(room.roomUsers[0].index, room.roomUsers[1].index);

  console.log(
    `Game created: ${game.idGame} with players: ${room.roomUsers[0].name} and ${room.roomUsers[1].name}`
  );
  room.roomUsers.forEach((user: User) => {
    sendToPlayer(
      user.index,
      JSON.stringify({
        type: "create_game",
        data: JSON.stringify({
          idGame: game.idGame,
          idPlayer: user.index,
        }),
        id: 0,
      })
    );
  });
  db.removeRoom(room.roomId);
  broadcastUpdateRoom();
};
