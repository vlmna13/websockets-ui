import { WebSocket } from "ws";
import { db } from "../database/dataBase";
import { sessionManager } from "../session/sessionManager";
import { GameLogicService } from "../services/gameLogicService";
import { sendError, createMessage } from "../utils/wsUtils";
import { updateWinners, sendTurnInfo } from "../utils/gameUtils";
import {
  AttackData,
  RandomAttackData,
  Position,
  AttackStatus,
  Ship,
  Board,
  Game,
  GamePlayer,
} from "../types/types";

export const handleAttack = (ws: WebSocket, data: AttackData): void => {
  const { gameId, x, y, indexPlayer } = data;
  const playerIndex = sessionManager.getPlayerIndex(ws);

  if (!validateAttack(ws, playerIndex, gameId, indexPlayer)) {
    return;
  }

  const game = db.getGameById(gameId);
  const opponent = game!.players.find((p) => p.index !== indexPlayer);

  if (!game || !opponent) {
    sendError(ws, "Game or opponent not found");
    return;
  }

  processAttack(game, opponent, { x, y }, indexPlayer);
};

export const handleRandomAttack = (
  ws: WebSocket,
  data: RandomAttackData
): void => {
  const { gameId, indexPlayer } = data;
  const playerIndex = sessionManager.getPlayerIndex(ws);

  if (!validateAttack(ws, playerIndex, gameId, indexPlayer)) {
    return;
  }

  const game = db.getGameById(gameId);
  const opponent = game!.players.find((p) => p.index !== indexPlayer);

  if (!game || !opponent) {
    sendError(ws, "Game or opponent not found");
    return;
  }

  const position = GameLogicService.getRandomAttackPosition(opponent.board);
  processAttack(game, opponent, position, indexPlayer);
};

const validateAttack = (
  ws: WebSocket,
  playerIndex: number | undefined,
  gameId: number,
  attackerIndex: number
): boolean => {
  if (!playerIndex) {
    sendError(ws, "Not authenticated");
    return false;
  }

  const game = db.getGameById(gameId);
  if (!game) {
    sendError(ws, "Game not found");
    return false;
  }

  if (game.currentPlayerIndex !== attackerIndex) {
    sendError(ws, "Not your turn");
    return false;
  }

  const opponent = game.players.find((p) => p.index !== attackerIndex);
  if (!opponent) {
    sendError(ws, "Opponent not found");
    return false;
  }

  return true;
};

const processAttack = (
  game: Game,
  opponent: GamePlayer,
  position: Position,
  attackerIndex: number
): void => {
  const { x, y } = position;

  if (!opponent.board[x]) {
    opponent.board[x] = [];
  }

  const hitShip = opponent.ships.find((ship) =>
    GameLogicService.checkShipHit(ship, x, y)
  );

  let shouldChangeTurn = false;

  if (hitShip) {
    opponent.board[x][y] = 2;
    handleShipHit(game, opponent, hitShip, position, attackerIndex);
  } else {
    opponent.board[x][y] = 1;
    handleMiss(game, position);
    shouldChangeTurn = true;
    game.currentPlayerIndex = opponent.index;
  }

  if (shouldChangeTurn) {
    sendTurnInfo(game);
  }
};

const handleShipHit = (
  game: Game,
  opponent: GamePlayer,
  hitShip: Ship,
  position: Position,
  attackerIndex: number
): void => {
  if (GameLogicService.isShipKilled(hitShip, opponent.board)) {
    broadcastAttack(game, position, "killed");
    const missedCells = GameLogicService.markAroundShip(
      hitShip,
      opponent.board
    );
    missedCells.forEach((cell) => {
      broadcastAttack(game, cell, "miss");
    });

    if (GameLogicService.checkGameFinished(opponent)) {
      finishGame(game, attackerIndex);
      return;
    }
  } else {
    broadcastAttack(game, position, "shot");
  }
};

const handleMiss = (game: Game, position: Position): void => {
  broadcastAttack(game, position, "miss");
};

const broadcastAttack = (
  game: Game,
  position: Position,
  status: AttackStatus
): void => {
  const message = createMessage("attack", {
    position,
    currentPlayer: game.currentPlayerIndex,
    status,
  });

  game.players.forEach((player) => {
    const ws = sessionManager.getSocket(player.index);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
};

const finishGame = (game: Game, winnerIndex: number): void => {
  const winner = db.getPlayerByIndex(winnerIndex);
  if (winner) {
    winner.wins++;
  }
  game.players.forEach((player) => {
    const ws = sessionManager.getSocket(player.index);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(createMessage("finish", { winPlayer: winnerIndex }));
    }
  });
  updateWinners();
  db.removeGame(game.idGame);
};