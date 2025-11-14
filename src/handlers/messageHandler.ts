import { WebSocket } from "ws";
import { WebSocketMessage } from "../types/types";
import { handleReg } from "./regHandler";
import { handleCreateRoom, handleAddUserToRoom } from "./roomHandler";

export const handleMessage = (ws: WebSocket, message: WebSocketMessage) => {
  console.log("Processing message type:", message.type);

  try {
    const data = message.data ? JSON.parse(message.data) : {};

    switch (message.type) {
      case "reg":
        handleReg(ws, data);
        break;
      case "create_room":
        handleCreateRoom(ws);
        break;
      case "add_user_to_room":
        handleAddUserToRoom(ws, data);
        break;
      default:
        console.log("Unknown message type:", message.type);
        ws.send(
          JSON.stringify({
            type: "error",
            data: JSON.stringify({ error: true, errorText: "Unknown command" }),
            id: 0,
          })
        );
    }
  } catch (error) {
    console.error("Error handling message:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({
          error: true,
          errorText: "Internal server error",
        }),
        id: 0,
      })
    );
  }
};
