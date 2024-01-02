import { Server } from "socket.io";
import { EventEmitter } from "events";

export interface Client {
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
