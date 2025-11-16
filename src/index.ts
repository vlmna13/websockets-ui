import { httpServer } from "./http_server/index";
import { createWSServer } from "./ws_server/ws_server";

const HTTP_PORT = 8181;
const WS_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

createWSServer();
console.log(`WebSocket server is running on ws://localhost:${WS_PORT}`);
