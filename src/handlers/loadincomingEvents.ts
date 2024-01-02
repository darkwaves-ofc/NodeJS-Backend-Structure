"use strict";

import { EventEmitter } from "events";
import { readdir } from "fs";
import socketIo, { Server, Socket } from "socket.io";
import { ParsedUrlQuery } from "querystring";

interface Client {
  server: any;
  config: any;
  links: string[];
  parseURL: (link: string) => any;
  ipport: (link: string, port: number) => string;
  port: number;
  logger: any;
  wspaths: Map<string, any>;
  io: Server;
  wsevents: EventEmitter;
}

interface WebSocketPath {
  name: string;
  run: (client: Client, socket: Socket, request: any) => void;
}

export = class WebSocketInitializer {
  private client: Client;

  constructor(client: Client) {
    if (!client) throw new Error(`client is required`);
    this.client = client;
    this.client.wspaths = new Map();
  }

  public async start() {
    this.client.wsevents = new EventEmitter().setMaxListeners(
      0,
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

    io.use((socket: any, next: any) => {
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

    let versions = await new Promise<string[]>((resolve) => {
      readdir("./src/websocket", (err, files) => {
        resolve(files);
      });
    });

    for (const version of versions) {
      const websocketFiles = await new Promise<string[]>((resolve, reject) => {
        readdir(`./src/websocket/${version}/`, (err, files) => {
          if (err) reject(err);
          resolve(files?.filter((f) => f.endsWith(".js")) || []);
        });
      });

      for (const file of websocketFiles) {
        try {
          const path: WebSocketPath = require(
            `../websocket/${version}/${file}`,
          );
          if (path.name && typeof path.run === "function") {
            this.client.wspaths.set(`/${version}${path.name}`, path);
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
      nameSpace.on("connection", (socket: any) => {
        path.run(this.client, socket, socket.request);
      });
    }
    this.client.logger.log("[ • ] Listening to incoming events");
  }
};
