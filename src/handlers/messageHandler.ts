import { WebSocket } from "ws";
import {
  WebSocketMessage,
  RegData,
  RoomData,
  AddShipsData,
  AttackData,
  RandomAttackData,
} from "../types/types";
import { handleReg } from "./regHandler";
import { handleCreateRoom, handleAddUserToRoom } from "./roomHandler";
import { handleAddShips } from "./gameHandler";
import { handleAttack, handleRandomAttack } from "./attackHandler";

export const handleMessage = (
  ws: WebSocket,
  message: WebSocketMessage
): void => {
  console.log("Processing message type:", message.type);

  try {
    const data = message.data ? JSON.parse(message.data) : {};
    routeMessage(ws, message.type, data);
  } catch (error) {
    console.error("Error handling message:", error);
    sendError(ws, "Internal server error");
  }
};

const routeMessage = (ws: WebSocket, type: string, data: any): void => {
  switch (type) {
    case "reg":
      handleReg(ws, data as RegData);
      break;
    case "create_room":
      handleCreateRoom(ws);
      break;
    case "add_user_to_room":
      handleAddUserToRoom(ws, data as RoomData);
      break;
    case "add_ships":
      handleAddShips(ws, data as AddShipsData);
      break;
    case "attack":
      handleAttack(ws, data as AttackData);
      break;
    case "randomAttack":
      handleRandomAttack(ws, data as RandomAttackData);
      break;
    default:
      console.log("Unknown message type:", type);
      sendError(ws, "Unknown command");
  }
};

const sendError = (ws: WebSocket, errorText: string): void => {
  ws.send(
    JSON.stringify({
      type: "error",
      data: JSON.stringify({ error: true, errorText }),
      id: 0,
    })
  );
};
