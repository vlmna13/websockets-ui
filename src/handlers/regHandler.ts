import { WebSocket } from "ws";
import { db } from "../database/dataBase";
import { sessionManager } from "../session/sessionManager";
import {
  broadcastUpdateRoom,
  broadcastUpdateWinners,
} from "./broadcastHandler";

export const handleReg = (ws: WebSocket, data: any) => {
  const { name, password } = data;

  if (!name || !password) {
    ws.send(
      JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name: name || "",
          index: 0,
          error: true,
          errorText: "Name and password are required",
        }),
        id: 0,
      })
    );
    return;
  }
  const existingPlayer = db.findPlayerByName(name);

  if (existingPlayer) {
    if (existingPlayer.password !== password) {
      ws.send(
        JSON.stringify({
          type: "reg",
          data: JSON.stringify({
            name,
            index: 0,
            error: true,
            errorText: "Invalid password",
          }),
          id: 0,
        })
      );
      return;
    }

    db.updatePlayerWs(existingPlayer.index, ws);
    sessionManager.loginPlayer(ws, existingPlayer.index);

    ws.send(
      JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name: existingPlayer.name,
          index: existingPlayer.index,
          error: false,
          errorText: "",
        }),
        id: 0,
      })
    );
  } else {
    const newPlayer = db.addPlayer(name, password);
    db.updatePlayerWs(newPlayer.index, ws);
    sessionManager.loginPlayer(ws, newPlayer.index);

    ws.send(
      JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name: newPlayer.name,
          index: newPlayer.index,
          error: false,
          errorText: "",
        }),
        id: 0,
      })
    );
  }
  broadcastUpdateRoom();
  broadcastUpdateWinners();
};
