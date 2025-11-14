import { WebSocket } from "ws";

export class SessionManager {
  private sessions: Map<WebSocket, number> = new Map();
  private playerSockets: Map<number, WebSocket> = new Map();

  loginPlayer(ws: WebSocket, playerIndex: number) {
    this.sessions.set(ws, playerIndex);
    this.playerSockets.set(playerIndex, ws);
  }

  logoutPlayer(ws: WebSocket) {
    const playerIndex = this.sessions.get(ws);
    if (playerIndex) {
      this.sessions.delete(ws);
      this.playerSockets.delete(playerIndex);
    }
  }

  getPlayerIndex(ws: WebSocket): number | undefined {
    return this.sessions.get(ws);
  }

  getSocket(playerIndex: number): WebSocket | undefined {
    return this.playerSockets.get(playerIndex);
  }

  getAllSockets(): WebSocket[] {
    return Array.from(this.sessions.keys());
  }

  isLoggedIn(ws: WebSocket): boolean {
    return this.sessions.has(ws);
  }
}

export const sessionManager = new SessionManager();
