import { WebSocketServer, WebSocket } from "ws";
import { handleMessage } from "../handlers/messageHandler";
import { sessionManager } from "../session/sessionManager";

export const createWSServer = (): WebSocketServer => {
  const wss = new WebSocketServer({ port: 3000 });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected");
    ws.on("message", (message: Buffer) => {
      console.log("Received:", message.toString());
      try {
        const parsedMessage = JSON.parse(message.toString());
        handleMessage(ws, parsedMessage);
      } catch (error) {
        console.error("Error parsing message:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            data: JSON.stringify({ error: true, errorText: "Invalid JSON" }),
            id: 0,
          })
        );
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      sessionManager.logoutPlayer(ws);
    });

    ws.on("error", (error: Error) => {
      console.error("WebSocket error:", error);
      sessionManager.logoutPlayer(ws);
    });
  });

  console.log("WebSocket server started on port 3000");
  return wss;
};
