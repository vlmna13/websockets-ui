import { Ship, Position, Board } from "../types/types";

export class GameLogicService {
  static checkShipHit(ship: Ship, x: number, y: number): boolean {
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
  }

  static isShipKilled(ship: Ship, board: Board): boolean {
    if (ship.direction) {
      for (let i = 0; i < ship.length; i++) {
        const cell = board[ship.position.x]?.[ship.position.y + i];
        if (cell !== 2) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < ship.length; i++) {
        const cell = board[ship.position.x + i]?.[ship.position.y];
        if (cell !== 2) {
          return false;
        }
      }
    }
    return true;
  }

  static markAroundShip(ship: Ship, board: Board): Position[] {
    const missedCells: Position[] = [];
    const startX = Math.max(0, ship.position.x - 1);
    const endX = Math.min(9, ship.direction ? ship.position.x + 1 : ship.position.x + ship.length);
    const startY = Math.max(0, ship.position.y - 1);
    const endY = Math.min(9, ship.direction ? ship.position.y + ship.length : ship.position.y + 1);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const isShipCell = this.checkShipHit(ship, x, y);
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
  }

  static checkGameFinished(player: { ships: Ship[]; board: Board }): boolean {
    return player.ships.every(ship => this.isShipKilled(ship, player.board));
  }

  static getRandomAttackPosition(board: Board): Position {
    const availableCells: Position[] = [];

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        if (!board[x] || board[x][y] === undefined) {
          availableCells.push({ x, y });
        }
      }
    }

    if (availableCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableCells.length);
      return availableCells[randomIndex];
    }

    return { x: 0, y: 0 };
  }
}
