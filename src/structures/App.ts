import express from "express";
import config from "../config";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import amqp from "amqplib";
import jwt from "jsonwebtoken";
import userDataDb from "../schema/userData";
import cors from "cors";
import getUserData from "../utils/getuserData.js";
import Logger from "../utils/logger";
// import * as CircularJSON from "circular-json";
// import * as dayjs from "dayjs";
// import { EventEmitter } from "ws";
// import { v4 as uuidv4 } from "uuid";
// import { CompressionTypes, Partitioners } from "kafkajs";

class App {
  private config: any;
  private express: any;
  private routes: Map<string, any>;
  private logger: any;
  private mongoose: any;
  private fileCache: Map<string, any>;
  private linkCache: Map<string, any>;
  private getUserData: any;
  private parseURL: any;
  private jwt: any;
  private ipport: any;
  private _errorMiddleware: any;
  private _requirehandlers: any;
  private port: any;
  private links: any;
  private server: any;
  private use: any;
  private listen: any;
  private set: any;
  private _router: any;
  private findUser: any;
  private connect: any;

  constructor() {
    // super();
    this.config = config;
    this.express = express;
    this.routes = new Map();
    this.logger = Logger;
    this.mongoose = mongoose;
    this.fileCache = new Map();
    this.linkCache = new Map();
    this.getUserData = getUserData;
    this.mongoose.Promise = global.Promise;

    this.mongoose.connection.on("connected", () => {
      this.logger.log("[DB] DATABASE CONNECTED", "ready");
    });

    this.mongoose.connection.on("err", (err: any) => {
      console.log(`Mongoose connection error: \n ${err.stack}`, "error");
    });

    this.mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected");
    });

    this.parseURL = function (link: string) {
      const parsedUrl = new URL(link);
      return parsedUrl;
    };

    this.jwt = jwt;

    this.ipport = function (link: string, port: number) {
      return `${link}${Number(port) === 80 ? "" : `:${port}`}`;
    };

    this._errorMiddleware = async function (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) {
      return res.status(404).json({ error: true, message: "page not found" });
    };

    this._requirehandlers = async function () {
      this.port = this.config.website.port;
      this.links = this.config.website.links;
      this.server = this.listen(this.port);
      this.use(
        cors({
          origin: this.config.website.fontendUri,
          methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
          credentials: true,
        })
      );
      this.use(
        async (
          req: express.Request,
          res: express.Response,
          next: express.NextFunction
        ) => {
          let checkHost = false;

          for (const x of this.links) {
            if (
              req.get("host") === this.parseURL(this.ipport(x, this.port)).host
            )
              checkHost = true;
          }

          if (!checkHost) {
            return res.status(403).json({ error: "Forbidden" });
          }

          res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
          );
          res.setHeader("Access-Control-Allow-Private-Network", "true");
          next();
        }
      );

      this.use(cookieParser(this.config.website.secretKey));
      this.use(express.static(`${process.cwd()}/website`));
      this.use(bodyParser.json({ limit: "1000mb" }));
      this.set("trust proxy", true);
      this.set("etag", false);
      this.set("view engine", "ejs");
      this.use(this._errorMiddleware);

      for (const x of [
        "loadroutes",
        "loadincomingEvents",
        "sendSystemStatus",
        "initDatabase",
      ]) {
        const handler = require(`../handlers/${x}.js`);
        await new handler(this).start();
      }

      this._router.stack.forEach((layer: any, index: any, layers: any) => {
        if (layer.handle === this._errorMiddleware) {
          layers.splice(index, 1);
        }
      });

      for (const [id, x] of this.routes) {
        this.use(`/api/${x.version}`, x);
      }

      this.use(this._errorMiddleware);
    };

    this.findUser = function (token: string, secret?: string) {
      return new Promise(async (resolve, reject) => {
        try {
          if (!token) {
            reject(new Error("Token is missing."));
            return;
          }

          if (secret) {
            let decoded = jwt.verify(token, secret);

            if (!decoded) {
              reject(new Error("Invalid token."));
              return;
            }

            let data = await userDataDb.findOne({
              // _id: decoded.uuid,
              _id: decoded,
            });

            if (!data) {
              reject(new Error("User data not found."));
              return;
            }

            const tokenSchema = data.tokens.find(
              (val: any) => val.token === token
            );

            if (!tokenSchema) {
              reject(new Error("Token not found for this user."));
              return;
            }

            resolve(data);
          } else {
            let data = await userDataDb.findOne({
              _id: token,
            });

            if (!data) {
              reject(new Error("User data not found."));
              return;
            }

            resolve(data);
          }
        } catch (error) {
          reject(error);
        }
      });
    };

    this.connect = async function () {
      this.logger.log(`[WebSite] Loading !`, "log");

      await this.mongoose.connect(this.config.mongourl, {
        useNewUrlParser: true,
        autoIndex: false,
        connectTimeoutMS: 10000,
        family: 4,
        useUnifiedTopology: true,
      });

      await this._requirehandlers();
      this.logger.log(`[WebSite] Website is now Online !`, "ready");
    };
  }
}

export = App;
