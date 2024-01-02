"use strict";

import { EventEmitter } from "events";
import { readdir } from "fs";
import socketIo, { Socket } from "socket.io";
import { AppTypes } from "../structures/App";

interface WebSocketPath {
  default: {
    name: string;
    run: (client: AppTypes, socket: Socket, request: Socket) => void;
  };
}

export = class WebSocketInitializer {
  private client: AppTypes;

  constructor(client: AppTypes) {
    if (!client) throw new Error(`client is required`);
    this.client = client;
    this.client.wspaths = new Map();
  }

  public async start() {
    this.client.wsevents = new EventEmitter().setMaxListeners(
      0
    ) as EventEmitter;

    const io = new socketIo.Server(this.client.server, {
      cors: {
        origin: this.client.config.website.fontendUri,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
      },
      transports: ["polling", "websocket"],
    });
    this.client.io = io;

    io.use((socket, next) => {
      const { host } = socket.request.headers;
      let checkHost = false;

      for (const x of this.client.links) {
        if (
          host ===
          this.client.parseURL(this.client.ipport(x, this.client.port)).host
        ) {
          checkHost = true;
          break;
        }
      }

      if (!checkHost) {
        return next(new Error("Forbidden"));
      }

      next();
    });

    let versions: string[] = []; // Ensure versions is initialized as an array
    try {
      versions = await new Promise<string[]>((resolve) => {
        readdir("./dist/websocket", (err, files) => {
          if (err) {
            console.error("Error reading directory:", err);
            resolve([]); // Resolve with an empty array if there's an error
          } else {
            resolve(files);
          }
        });
      });
    } catch (error) {
      console.error("Error getting versions:", error);
    }

    for (const version of versions) {
      const websocketFiles = await new Promise<string[]>((resolve, reject) => {
        readdir(`./dist/websocket/${version}/`, (err, files) => {
          if (err) reject(err);
          resolve(files?.filter((f) => f.endsWith(".js")) || []);
        });
      });

      for (const file of websocketFiles) {
        try {
          const path: WebSocketPath = require(`../websocket/${version}/${file}`);
          if (path.default.name && typeof path.default.run === "function") {
            this.client.wspaths.set(`/${version}${path.default.name}`, path);
          } else {
            console.log(`Invalid module: ${file}`);
          }
        } catch (error) {
          console.error(`Error loading module ${file}:`, error);
        }
      }
    }

    for (const [name, path] of this.client.wspaths) {
      const nameSpace = io.of(name);
      nameSpace.on("connection", (socket: Socket) => {
        path.run(this.client, socket, socket.request);
      });
    }
    this.client.logger.log("[ • ] Listening to incoming events");
  }
};
