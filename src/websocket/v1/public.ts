"use strict";
import CircularJSON from "circular-json";
import dayjs from "dayjs";
import userDataDb from "../../schema/userData";
import Crypto from "node:crypto";
import broadcastMessage from "../../schema/broadcastMessage";
import { AppTypes } from "../../structures/App";
import { Socket as BaseSocket } from "socket.io";

interface Socket extends BaseSocket {
  sessionId: string; // Define the 'sessionId' property
}

export default {
  name: "/public",
  async run(client: AppTypes, socket: Socket, req: any, params: any) {
    const sendMessage = async function (data: any) {
      socket.emit("server-message", data);
    };

    const handleSend = async function ({ ...args }: any) {
      switch (args.type) {
        case "message": {
          const messageData = args.payload;
          await sendMessage({ type: "message", payload: messageData });
          break;
        }
        case "houseScoreUpdate": {
          const houseData = args.payload;
          await sendMessage({ type: "houseScoreUpdate", payload: houseData });
          break;
        }
        case "eventUpdate": {
          const eventData = args.payload;
          await sendMessage({ type: "eventUpdate", payload: eventData });
          break;
        }
      }
    };

    const handleClear = function () {
      socket.removeListener("disconnect", handleClear);
      client.wsevents.removeListener("public", handleSend);
    };
    client.wsevents.on("public", handleSend);
    socket.on("disconnect", handleClear);
  },
};
