import { WebSocket } from "ws";
import { db } from "../database/dataBase";
import { sessionManager } from "../session/sessionManager";
import { broadcastUpdateRoom, sendToPlayer } from "./broadcastHandler";

export const handleCreateRoom = (ws: WebSocket) => {
  const playerIndex = sessionManager.getPlayerIndex(ws);

  if (!playerIndex) {
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({ error: true, errorText: "Not authenticated" }),
        id: 0,
      })
    );
    return;
  }

  const player = db.getPlayerByIndex(playerIndex);
  if (!player) {
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({ error: true, errorText: "Player not found" }),
        id: 0,
      })
    );
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

  ws.send(
    JSON.stringify({
      type: "create_room",
      data: JSON.stringify({}),
      id: 0,
    })
  );
};

export const handleAddUserToRoom = (ws: WebSocket, data: any) => {
  const { indexRoom } = data;
  const playerIndex = sessionManager.getPlayerIndex(ws);

  if (!playerIndex) {
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({ error: true, errorText: "Not authenticated" }),
        id: 0,
      })
    );
    return;
  }

  const player = db.getPlayerByIndex(playerIndex);
  if (!player) {
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({ error: true, errorText: "Player not found" }),
        id: 0,
      })
    );
    return;
  }

  const targetRoom = db.getRoomById(indexRoom);
  if (targetRoom && targetRoom.roomUsers[0].index === playerIndex) {
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({
          error: true,
          errorText: "Cannot join your own room",
        }),
        id: 0,
      })
    );
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
    ws.send(
      JSON.stringify({
        type: "add_user_to_room",
        data: JSON.stringify({}),
        id: 0,
      })
    );
    return;
  }

  const room = db.getRoomById(indexRoom);
  if (!room) {
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({ error: true, errorText: "Room not found" }),
        id: 0,
      })
    );
    return;
  }

  const success = db.addPlayerToRoom(indexRoom, player.name, playerIndex);

  if (success) {
    console.log(`Player ${player.name} joined room ${indexRoom}`);
    const updatedRoom = db.getRoomById(indexRoom);
    if (updatedRoom && updatedRoom.roomUsers.length === 2) {
      const game = db.createGame(
        updatedRoom.roomUsers[0].index,
        updatedRoom.roomUsers[1].index
      );

      console.log(
        `Game created: ${game.idGame} with players: ${updatedRoom.roomUsers[0].name} and ${updatedRoom.roomUsers[1].name}`
      );
      updatedRoom.roomUsers.forEach((user) => {
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

      db.removeRoom(indexRoom);
      broadcastUpdateRoom();
    }

    ws.send(
      JSON.stringify({
        type: "add_user_to_room",
        data: JSON.stringify({}),
        id: 0,
      })
    );
  } else {
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({
          error: true,
          errorText: "Cannot join room - room may be full",
        }),
        id: 0,
      })
    );
  }
};
