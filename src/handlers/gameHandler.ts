import { WebSocket } from "ws";
import { db } from "../database/dataBase";
import { sessionManager } from "../session/sessionManager.js";
import { sendToPlayer } from "./broadcastHandler.js";

export const handleAddShips = (ws: WebSocket, data: any) => {
  const { gameId, ships, indexPlayer } = data;
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

  const game = db.getGameById(gameId);
  if (!game) {
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({ error: true, errorText: "Game not found" }),
        id: 0,
      })
    );
    return;
  }

  const playerInGame = game.players.find((p) => p.index === indexPlayer);
  if (playerInGame) {
    playerInGame.ships = ships;
    console.log(`Ships added for player ${indexPlayer} in game ${gameId}`);
  }

  ws.send(
    JSON.stringify({
      type: "add_ships",
      data: JSON.stringify({ success: true }),
      id: 0,
    })
  );

  checkGameStart(game);
};

const checkGameStart = (game: any) => {
  const bothPlayersReady = game.players.every(
    (player: any) => player.ships && player.ships.length > 0
  );

  if (bothPlayersReady) {
    console.log(
      `Starting game ${game.idGame} - both players have placed ships`
    );

    game.players.forEach((player: any) => {
      sendToPlayer(
        player.index,
        JSON.stringify({
          type: "start_game",
          data: JSON.stringify({
            ships: player.ships,
            currentPlayerIndex: game.currentPlayerIndex,
          }),
          id: 0,
        })
      );
    });

    sendTurnInfo(game);
  } else {
    console.log(
      `Waiting for other player to place ships in game ${game.idGame}`
    );
  }
};

const sendTurnInfo = (game: any) => {
  game.players.forEach((player: any) => {
    sendToPlayer(
      player.index,
      JSON.stringify({
        type: "turn",
        data: JSON.stringify({
          currentPlayer: game.currentPlayerIndex,
        }),
        id: 0,
      })
    );
  });
};
