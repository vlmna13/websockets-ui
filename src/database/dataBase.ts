import { Player, Room, Game } from "../types/types";
import { WebSocket } from "ws";

class Database {
  private players: Player[];
  private rooms: Room[];
  private games: Game[];
  private currentPlayerIndex: number;
  private currentRoomId: number;
  private currentGameId: number;

  constructor() {
    this.players = [];
    this.rooms = [];
    this.games = [];
    this.currentPlayerIndex = 1;
    this.currentRoomId = 1;
    this.currentGameId = 1;
  }

  addPlayer(name: string, password: string): Player {
    const player: Player = {
      name,
      password,
      index: this.currentPlayerIndex++,
      wins: 0,
    };
    this.players.push(player);
    return player;
  }

  findPlayerByName(name: string): Player | undefined {
    return this.players.find((p) => p.name === name);
  }

  getPlayerByIndex(index: number): Player | undefined {
    return this.players.find((p) => p.index === index);
  }

  getAllPlayers(): Player[] {
    return [...this.players];
  }

  updatePlayerWs(index: number, ws: WebSocket) {
    const player = this.getPlayerByIndex(index);
    if (player) {
      player.ws = ws;
    }
  }

  createRoom(playerName: string, playerIndex: number): Room {
    const room: Room = {
      roomId: this.currentRoomId++,
      roomUsers: [{ name: playerName, index: playerIndex }],
    };
    this.rooms.push(room);
    return room;
  }

  getRooms(): Room[] {
    return this.rooms.filter((room) => room.roomUsers.length === 1);
  }

  getRoomById(roomId: number): Room | undefined {
    return this.rooms.find((room) => room.roomId === roomId);
  }

  getRoomByPlayerIndex(playerIndex: number): Room | undefined {
    return this.rooms.find((room) =>
      room.roomUsers.some((user) => user.index === playerIndex)
    );
  }

  isPlayerInRoom(playerIndex: number): boolean {
    return this.rooms.some((room) =>
      room.roomUsers.some((user) => user.index === playerIndex)
    );
  }

  addPlayerToRoom(
    roomId: number,
    playerName: string,
    playerIndex: number
  ): boolean {
    const room = this.getRoomById(roomId);
    if (room && room.roomUsers.length === 1) {
      room.roomUsers.push({ name: playerName, index: playerIndex });
      return true;
    }
    return false;
  }

  removeRoom(roomId: number) {
    this.rooms = this.rooms.filter((room) => room.roomId !== roomId);
  }

  createGame(player1Index: number, player2Index: number): Game {
    const game: Game = {
      idGame: this.currentGameId++,
      players: [
        { index: player1Index, ships: [], board: [] },
        { index: player2Index, ships: [], board: [] },
      ],
      currentPlayerIndex: player1Index,
    };
    this.games.push(game);
    return game;
  }

  getGameById(gameId: number): Game | undefined {
    return this.games.find((game) => game.idGame === gameId);
  }

  getGameByPlayerIndex(playerIndex: number): Game | undefined {
    return this.games.find((game) =>
      game.players.some((player) => player.index === playerIndex)
    );
  }
}

export const db = new Database();
