import { WebSocket } from "ws";

export type ShipType = "small" | "medium" | "large" | "huge";

export interface Ship {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: ShipType;
}

export interface Player {
  name: string;
  password: string;
  index: number;
  wins: number;
  ws?: WebSocket;
}

export interface Room {
  roomId: number;
  roomUsers: {
    name: string;
    index: number;
  }[];
}

export interface Game {
  idGame: number;
  players: {
    index: number;
    ships: Ship[];
    board: (0 | 1 | 2)[][];
  }[];
  currentPlayerIndex: number;
}

export interface WebSocketMessage {
  type: string;
  data: string;
  id: 0;
}

export interface AttackData {
  gameId: number;
  x: number;
  y: number;
  indexPlayer: number;
}

export interface RandomAttackData {
  gameId: number;
  indexPlayer: number;
}

export interface AttackResult {
  position: {
    x: number;
    y: number;
  };
  currentPlayer: number;
  status: "miss" | "killed" | "shot";
}

export interface FinishGameData {
  winPlayer: number;
}
