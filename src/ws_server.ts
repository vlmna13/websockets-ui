import { WebSocketServer, WebSocket } from 'ws';

export const createWSServer = (): WebSocketServer => {
  const wss = new WebSocketServer({ port: 3000 });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected');
    
    ws.on('message', (message: Buffer) => {
      console.log('Received:', message.toString());
      ws.send(`Server received: ${message.toString()}`);
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server started on port 3000');
  return wss;
};