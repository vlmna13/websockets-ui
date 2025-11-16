import { WebSocket } from "ws";
import { db } from "../database/dataBase";
import { sessionManager } from "../session/sessionManager";
import { sendToPlayer } from "./broadcastHandler";
import { AddShipsData, Game } from "../types/types";
import { sendError, sendSuccess } from "../utils/wsUtils";

export const handleAddShips = (ws: WebSocket, data: AddShipsData): void => {
  const { gameId, ships, indexPlayer } = data;
  const playerIndex = sessionManager.getPlayerIndex(ws);

  if (!playerIndex) {
    sendError(ws, "Not authenticated");
    return;
  }

  const game = db.getGameById(gameId);
  if (!game) {
    sendError(ws, "Game not found");
    return;
  }

  const playerInGame = game.players.find((p) => p.index === indexPlayer);
  if (playerInGame) {
    playerInGame.ships = ships;
    console.log(`Ships added for player ${indexPlayer} in game ${gameId}`);
  }
  sendSuccess(ws, "add_ships");
  checkGameStart(game);
};

const checkGameStart = (game: Game): void => {
  const bothPlayersReady = game.players.every(
    (player) => player.ships && player.ships.length > 0
  );

  if (bothPlayersReady) {
    console.log(
      `Starting game ${game.idGame} - both players have placed ships`
    );
    game.players.forEach((player) => {
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

const sendTurnInfo = (game: Game): void => {
  game.players.forEach((player) => {
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
