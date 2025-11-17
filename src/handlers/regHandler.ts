import { WebSocket } from "ws";
import { db } from "../database/dataBase";
import { sessionManager } from "../session/sessionManager";
import {
  broadcastUpdateRoom,
  broadcastUpdateWinners,
} from "./broadcastHandler";
import { Player, RegData, RegResponse } from "../types/types";

export const handleReg = (ws: WebSocket, data: RegData): void => {
  const { name, password } = data;
  if (!name || !password) {
    sendRegistrationError(ws, name || "", "Name and password are required");
    return;
  }

  const existingPlayer = db.findPlayerByName(name);

  if (existingPlayer) {
    handleExistingPlayer(ws, existingPlayer, password, name);
  } else {
    handleNewPlayer(ws, name, password);
  }

  broadcastUpdateRoom();
  broadcastUpdateWinners();
};

const handleExistingPlayer = (
  ws: WebSocket,
  player: Player,
  password: string,
  name: string
): void => {
  if (player.password !== password) {
    sendRegistrationError(ws, name, "Invalid password");
    return;
  }

  db.updatePlayerWs(player.index, ws);
  sessionManager.loginPlayer(ws, player.index);

  sendRegistrationSuccess(ws, player.name, player.index);
};

const handleNewPlayer = (
  ws: WebSocket,
  name: string,
  password: string
): void => {
  const newPlayer = db.addPlayer(name, password);
  db.updatePlayerWs(newPlayer.index, ws);
  sessionManager.loginPlayer(ws, newPlayer.index);

  sendRegistrationSuccess(ws, newPlayer.name, newPlayer.index);
};

const sendRegistrationError = (
  ws: WebSocket,
  name: string,
  errorText: string
): void => {
  const response: RegResponse = {
    name,
    index: 0,
    error: true,
    errorText,
  };

  ws.send(
    JSON.stringify({
      type: "reg",
      data: JSON.stringify(response),
      id: 0,
    })
  );
};

const sendRegistrationSuccess = (
  ws: WebSocket,
  name: string,
  index: number
): void => {
  const response: RegResponse = {
    name,
    index,
    error: false,
    errorText: "",
  };

  ws.send(
    JSON.stringify({
      type: "reg",
      data: JSON.stringify(response),
      id: 0,
    })
  );
};
