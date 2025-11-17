import { db } from "../database/dataBase";
import { sessionManager } from "../session/sessionManager";
import { Game, GamePlayer } from "../types/types";
import { createMessage } from "./wsUtils";

export const updateWinners = (): void => {
  const winners = db.getAllPlayers()
    .filter(player => player.wins > 0)
    .map(player => ({
      name: player.name,
      wins: player.wins
    }));

  const message = createMessage("update_winners", winners);
    const allSockets = sessionManager.getAllSockets();
  allSockets.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
};

export const sendTurnInfo = (game: Game): void => {
  const message = createMessage("turn", {
    currentPlayer: game.currentPlayerIndex,
  });

  game.players.forEach((player: GamePlayer) => {
    const ws = sessionManager.getSocket(player.index);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
};