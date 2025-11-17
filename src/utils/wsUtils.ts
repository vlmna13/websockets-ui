import { WebSocket } from "ws";

export const sendError = (ws: WebSocket, errorText: string): void => {
  const errorMessage = {
    type: "error" as const,
    data: JSON.stringify({ error: true, errorText }),
    id: 0
  };
  ws.send(JSON.stringify(errorMessage));
};

export const sendSuccess = (ws: WebSocket, type: string, data: unknown = {}): void => {
  const message = {
    type,
    data: JSON.stringify(data),
    id: 0
  };
  ws.send(JSON.stringify(message));
};

export const createMessage = (type: string, data: unknown): string => {
  return JSON.stringify({
    type,
    data: JSON.stringify(data),
    id: 0
  });
};

export const isWebSocketOpen = (ws: WebSocket): boolean => {
  return ws.readyState === ws.OPEN;
};