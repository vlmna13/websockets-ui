import { WebSocket } from "ws";
import { db } from "../database/dataBase";
import { sessionManager } from "../session/sessionManager";
import { sendToPlayer } from "./broadcastHandler";

export const handleAttack = (ws: WebSocket, data: any) => {
  const { gameId, x, y, indexPlayer } = data;
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

  if (game.currentPlayerIndex !== indexPlayer) {
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({ error: true, errorText: "Not your turn" }),
        id: 0,
      })
    );
    return;
  }

  const opponent = game.players.find((p) => p.index !== indexPlayer);
  if (!opponent) {
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({ error: true, errorText: "Opponent not found" }),
        id: 0,
      })
    );
    return;
  }

  const hitShip = opponent.ships.find((ship) => checkShipHit(ship, x, y));

  let status: "miss" | "shot" | "killed" = "miss";
  let shouldChangeTurn = false;

  if (hitShip) {
    if (!opponent.board[x]) opponent.board[x] = [];
    opponent.board[x][y] = 2;

    if (isShipKilled(hitShip, opponent.board)) {
      status = "killed";

      const missedCells = markAroundShip(hitShip, opponent.board);

      game.players.forEach((player) => {
        sendToPlayer(
          player.index,
          JSON.stringify({
            type: "attack",
            data: JSON.stringify({
              position: { x, y },
              currentPlayer: game.currentPlayerIndex,
              status: "killed",
            }),
            id: 0,
          })
        );
      });

      missedCells.forEach((cell) => {
        game.players.forEach((player) => {
          sendToPlayer(
            player.index,
            JSON.stringify({
              type: "attack",
              data: JSON.stringify({
                position: { x: cell.x, y: cell.y },
                currentPlayer: game.currentPlayerIndex,
                status: "miss",
              }),
              id: 0,
            })
          );
        });
      });
      if (checkGameFinished(opponent)) {
        finishGame(game, indexPlayer);
        return;
      }
      shouldChangeTurn = false;
    } else {
      status = "shot";

      game.players.forEach((player) => {
        sendToPlayer(
          player.index,
          JSON.stringify({
            type: "attack",
            data: JSON.stringify({
              position: { x, y },
              currentPlayer: game.currentPlayerIndex,
              status: "shot",
            }),
            id: 0,
          })
        );
      });

      shouldChangeTurn = false;
    }
  } else {
    status = "miss";
    if (!opponent.board[x]) opponent.board[x] = [];
    opponent.board[x][y] = 1;

    game.players.forEach((player) => {
      sendToPlayer(
        player.index,
        JSON.stringify({
          type: "attack",
          data: JSON.stringify({
            position: { x, y },
            currentPlayer: game.currentPlayerIndex,
            status: "miss",
          }),
          id: 0,
        })
      );
    });

    shouldChangeTurn = true;
    game.currentPlayerIndex = opponent.index;
  }

  if (shouldChangeTurn) {
    sendTurnInfo(game);
  }
};

export const handleRandomAttack = (ws: WebSocket, data: any) => {
  const { gameId, indexPlayer } = data;
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

  const opponent = game.players.find((p) => p.index !== indexPlayer);
  if (!opponent) return;

  let x, y;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    x = Math.floor(Math.random() * 10);
    y = Math.floor(Math.random() * 10);
    attempts++;

    if (attempts >= maxAttempts) {
      let found = false;
      for (let i = 0; i < 10 && !found; i++) {
        for (let j = 0; j < 10 && !found; j++) {
          if (!opponent.board[i] || opponent.board[i][j] === undefined) {
            x = i;
            y = j;
            found = true;
          }
        }
      }
      break;
    }
  } while (opponent.board[x] && opponent.board[x][y] !== undefined);

  handleAttack(ws, { gameId, x, y, indexPlayer });
};

const checkShipHit = (ship: any, x: number, y: number): boolean => {
  if (ship.direction) {
    return (
      ship.position.x === x &&
      y >= ship.position.y &&
      y < ship.position.y + ship.length
    );
  } else {
    return (
      ship.position.y === y &&
      x >= ship.position.x &&
      x < ship.position.x + ship.length
    );
  }
};

const isShipKilled = (ship: any, board: any[][]): boolean => {
  if (ship.direction) {
    for (let i = 0; i < ship.length; i++) {
      if (board[ship.position.x]?.[ship.position.y + i] !== 2) {
        return false;
      }
    }
  } else {
    for (let i = 0; i < ship.length; i++) {
      if (board[ship.position.x + i]?.[ship.position.y] !== 2) {
        return false;
      }
    }
  }
  return true;
};

const markAroundShip = (
  ship: any,
  board: any[][]
): { x: number; y: number }[] => {
  const missedCells: { x: number; y: number }[] = [];

  const startX = Math.max(0, ship.position.x - 1);
  const endX = Math.min(
    9,
    ship.direction ? ship.position.x + 1 : ship.position.x + ship.length
  );
  const startY = Math.max(0, ship.position.y - 1);
  const endY = Math.min(
    9,
    ship.direction ? ship.position.y + ship.length : ship.position.y + 1
  );

  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      const isShipCell = checkShipHit(ship, x, y);

      if (!isShipCell) {
        if (!board[x]) board[x] = [];
        if (board[x][y] === undefined || board[x][y] === 0) {
          board[x][y] = 1;
          missedCells.push({ x, y });
        }
      }
    }
  }

  return missedCells;
};

const checkGameFinished = (player: any): boolean => {
  return player.ships.every((ship: any) => isShipKilled(ship, player.board));
};

const finishGame = (game: any, winnerIndex: number) => {
  const winner = db.getPlayerByIndex(winnerIndex);
  if (winner) {
    winner.wins++;
  }
  game.players.forEach((player: any) => {
    sendToPlayer(
      player.index,
      JSON.stringify({
        type: "finish",
        data: JSON.stringify({ winPlayer: winnerIndex }),
        id: 0,
      })
    );
  });
  const winners = db
    .getAllPlayers()
    .filter((player) => player.wins > 0)
    .map((player) => ({
      name: player.name,
      wins: player.wins,
    }));

  const winnersMessage = JSON.stringify({
    type: "update_winners",
    data: JSON.stringify(winners),
    id: 0,
  });

  game.players.forEach((player: any) => {
    sendToPlayer(player.index, winnersMessage);
  });
  db.removeGame(game.idGame);
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
