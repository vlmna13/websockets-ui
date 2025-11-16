import { Player, Room, Game, User, GamePlayer } from "../types/types";
import { WebSocket } from "ws";

export class Database {
  private players: Map<number, Player> = new Map();
  private rooms: Map<number, Room> = new Map();
  private games: Map<number, Game> = new Map();

  private playerIdGenerator = this.createIdGenerator();
  private roomIdGenerator = this.createIdGenerator();
  private gameIdGenerator = this.createIdGenerator();

  private playerNameIndex: Map<string, number> = new Map();
  private playerRoomIndex: Map<number, number> = new Map();
  private playerGameIndex: Map<number, number> = new Map();

  private createIdGenerator(): () => number {
    let id = 1;
    return () => id++;
  }

  addPlayer(name: string, password: string): Player {
    const index = this.playerIdGenerator();
    const player: Player = {
      name,
      password,
      index,
      wins: 0,
    };

    this.players.set(index, player);
    this.playerNameIndex.set(name, index);
    return player;
  }

  findPlayerByName(name: string): Player | undefined {
    const playerId = this.playerNameIndex.get(name);
    return playerId ? this.players.get(playerId) : undefined;
  }

  getPlayerByIndex(index: number): Player | undefined {
    return this.players.get(index);
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  updatePlayerWs(index: number, ws: WebSocket): boolean {
    const player = this.players.get(index);
    if (!player) return false;

    player.ws = ws;
    return true;
  }

  createRoom(playerName: string, playerIndex: number): Room {
    const roomId = this.roomIdGenerator();
    const room: Room = {
      roomId,
      roomUsers: [{ name: playerName, index: playerIndex }],
    };
    this.rooms.set(roomId, room);
    this.playerRoomIndex.set(playerIndex, roomId);
    return room;
  }

  getRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(
      (room) => room.roomUsers.length === 1
    );
  }

  getRoomById(roomId: number): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByPlayerIndex(playerIndex: number): Room | undefined {
    const roomId = this.playerRoomIndex.get(playerIndex);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  isPlayerInRoom(playerIndex: number): boolean {
    return this.playerRoomIndex.has(playerIndex);
  }

  addPlayerToRoom(
    roomId: number,
    playerName: string,
    playerIndex: number
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.roomUsers.length !== 1) return false;
    room.roomUsers.push({ name: playerName, index: playerIndex });
    this.playerRoomIndex.set(playerIndex, roomId);
    return true;
  }

  removeRoom(roomId: number): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.roomUsers.forEach((user) => {
      this.playerRoomIndex.delete(user.index);
    });
    return this.rooms.delete(roomId);
  }

  createGame(player1Index: number, player2Index: number): Game {
    const gameId = this.gameIdGenerator();
    const gamePlayers: GamePlayer[] = [
      { index: player1Index, ships: [], board: [] },
      { index: player2Index, ships: [], board: [] },
    ];

    const game: Game = {
      idGame: gameId,
      players: gamePlayers,
      currentPlayerIndex: player1Index,
    };

    this.games.set(gameId, game);
    this.playerGameIndex.set(player1Index, gameId);
    this.playerGameIndex.set(player2Index, gameId);
    return game;
  }

  getGameById(gameId: number): Game | undefined {
    return this.games.get(gameId);
  }

  getGameByPlayerIndex(playerIndex: number): Game | undefined {
    const gameId = this.playerGameIndex.get(playerIndex);
    return gameId ? this.games.get(gameId) : undefined;
  }

  removeGame(gameId: number): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;
    game.players.forEach((player) => {
      this.playerGameIndex.delete(player.index);
    });

    return this.games.delete(gameId);
  }

  removePlayerFromRoom(playerIndex: number): boolean {
    const roomId = this.playerRoomIndex.get(playerIndex);
    if (!roomId) return false;

    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.roomUsers = room.roomUsers.filter(
      (user) => user.index !== playerIndex
    );
    this.playerRoomIndex.delete(playerIndex);
    if (room.roomUsers.length === 0) {
      this.rooms.delete(roomId);
    }

    return true;
  }
}

export const db = new Database();
