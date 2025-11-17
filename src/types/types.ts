import { WebSocket } from "ws";

export interface User {
  name: string;
  index: number;
}

export interface Player extends User {
  password: string;
  wins: number;
  ws?: WebSocket;
}

export interface Room {
  roomId: number;
  roomUsers: User[];
}

export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  position: Position;
  direction: boolean;
  length: number;
  type: "small" | "medium" | "large" | "huge";
}

export type CellState = 0 | 1 | 2;
export type Board = CellState[][];

export interface GamePlayer {
  index: number;
  ships: Ship[];
  board: Board;
}

export interface Game {
  idGame: number;
  players: GamePlayer[];
  currentPlayerIndex: number;
}

export interface WebSocketMessage {
  type: MessageType;
  data: string;
  id: number;
}

export type MessageType = 
  | "reg"
  | "create_room"
  | "add_user_to_room"
  | "add_ships"
  | "attack"
  | "randomAttack"
  | "turn"
  | "finish"
  | "start_game"
  | "create_game"
  | "update_room"
  | "update_winners"
  | "error";

export interface RegData {
  name: string;
  password: string;
}

export interface RoomData {
  indexRoom: number;
}

export interface AddShipsData {
  gameId: number;
  ships: Ship[];
  indexPlayer: number;
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

export interface RegResponse {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
}

export interface GameCreatedResponse {
  idGame: number;
  idPlayer: number;
}

export interface AttackResponse {
  position: Position;
  currentPlayer: number;
  status: "miss" | "shot" | "killed";
}

export interface TurnResponse {
  currentPlayer: number;
}

export interface FinishResponse {
  winPlayer: number;
}

export interface WinnersResponse {
  name: string;
  wins: number;
}

export type AttackStatus = "miss" | "shot" | "killed";
