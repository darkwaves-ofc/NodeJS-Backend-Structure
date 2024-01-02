"use strict";
import CircularJSON from "circular-json";
import dayjs from "dayjs";
import userDataDb from "../../schema/userData";
import Crypto from "node:crypto";
import broadcastMessage from "../../schema/broadcastMessage";
import eventDataSchema from "../../schema/eventData";
import { AppTypes } from "../../structures/App";
import { Socket as BaseSocket } from "socket.io";

interface State {
  authenticated: boolean | null;
  id: string | null;
  token: string | null;
}

interface Socket extends BaseSocket {
  sessionId: string; // Define the 'sessionId' property
}

export default {
  name: "/home",
  async run(client: AppTypes, socket: Socket, req: any, params: any) {
    const state: State = { authenticated: null, id: null, token: null };

    const sendMessage = async function (data: any) {
      socket.emit("server-message", data);
    };

    const sendMessageAuth = async function (data: any) {
      let authenticated = false;
      const sToken =
        (state.id ?? "") + new Date().toString() + Crypto.randomUUID();
      sendMessage({
        type: "preflight",
        payload: { sToken },
      });
      await new Promise<void>((resolve, reject) => {
        const handleReceive = function (d: any) {
          const { type, payload } = d;
          if (!type || !payload) return;
          if (type !== "preflight") return;
          if (payload.sToken !== sToken) return;
          if (payload.token !== state.token) return handleClear();
          authenticated = true;
          return handleClear();
        };
        const handleClear = function () {
          socket.removeListener("client-message", handleReceive);
          socket.removeListener("disconnect", handleClear);
          resolve();
        };
        setTimeout(() => {
          handleClear();
        }, 1000 * 60 * 2);
        socket.on("client-message", handleReceive);
        socket.on("disconnect", handleClear);
      });
      if (!authenticated) return;
      socket.emit("server-message", data);
    };

    const handleIncoming = async function (d: any) {
      const data = d;
      switch (data.type) {
        case "auth": {
          const tokenUserData = await client
            .findUser(data.payload, client.config.website.secretKey)
            .catch(() => {});
          if (!tokenUserData) {
            return await sendMessage({
              type: "auth",
              payload: { success: false, message: "cannot authenticate" },
            });
          }
          state.id = String(tokenUserData._id);
          state.token = data.payload;
          state.authenticated = true;
          return await sendMessage({
            type: "auth",
            payload: { success: true, message: "successfully authenticated" },
          });
        }
        case "message": {
          const user = await userDataDb.findOne({ _id: state.id });
          const messageData = data.payload;
          const messageSchema = new broadcastMessage({
            content: messageData.content,
            type: messageData.type,
            sender: user?._id.toString(),
          });
          await messageSchema.save();
          client.wsevents.emit("home", {
            type: "message",
            payload: messageData,
          });
          if (messageData.type === "public")
            client.wsevents.emit("public", {
              type: "message",
              payload: messageData,
            });
          return;
        }
      }
    };

    const handleSend = async function ({ ...args }: any) {
      if (!state.authenticated) return;
      switch (args.type) {
        /**Check the login if it emits to set */
        case "checkLogin": {
          const { id } = args.payload;
          if (id !== state.id && state.token !== state.token) return;

          await sendMessage({
            type: "checkLogin",
            payload: { message: "logged out" },
          });

          socket.disconnect();
          break;
        }
        case "systemInfo": {
          await sendMessageAuth({
            type: "systemInfo",
            payload: args.specs,
          });
          break;
        }
        case "message": {
          const messageData = args.payload;
          console.log(messageData);
          await sendMessageAuth({
            type: "message",
            payload: messageData,
          });
          break;
        }
        case "eventSubmits": {
          const EventData = args.payload;
          await sendMessageAuth({
            type: "eventSubmits",
            payload: EventData,
          });
          break;
        }
        case "eventApproves": {
          const EventData = args.payload;
          await sendMessageAuth({
            type: "eventApproves",
            payload: EventData,
          });
          break;
        }
      }
    };

    const handleClear = function () {
      socket.removeListener("client-message", handleIncoming);
      socket.removeListener("disconnect", handleClear);
      client.wsevents.removeListener("home", handleSend);
    };
    socket.sessionId = Date.now().toString() + Crypto.randomUUID();
    client.wsevents.on("home", handleSend);
    socket.on("disconnect", handleClear);
    socket.on("client-message", handleIncoming);
  },
};
