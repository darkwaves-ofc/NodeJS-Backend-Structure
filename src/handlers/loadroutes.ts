"use strict";

import { readdir } from "fs";
import { AppTypes } from "../structures/App";

interface Route {
  version: string;
}

interface Path {
  name: string;
  route: RouteConstructor;
}
interface RouteConstructor {
  new (client: AppTypes): Route; // If Route is a class and takes AppTypes in its constructor
}

export = class RoutesInitializer {
  private client: AppTypes;

  constructor(client: AppTypes) {
    if (!client) throw new Error(`client is required`);
    this.client = client;
  }

  public async start() {
    let versions = await new Promise<string[]>((resolve) => {
      readdir("./dist/routes", (err, files) => {
        resolve(files);
      });
    });

    for (const version of versions) {
      const dirs = await new Promise<string[]>((resolve) => {
        readdir(`./dist/routes/${version}/`, (err, dirs) => {
          resolve(dirs);
        });
      });

      for (const dir of dirs) {
        const webFiles = await new Promise<string[]>((resolve) => {
          readdir(`./dist/routes/${version}/${dir}/`, (err, files) => {
            resolve(files?.filter((f) => f.endsWith(".js")) || []);
          });
        });

        for (const file of webFiles) {
          const path: Path = require(`../routes/${version}/${dir}/${file}`);

          if (path.name && path.route) {
            const route: Route = new path.route(this.client);
            route.version = version;
            this.client.routes.set(`${path.name}-${route.version}`, route);
          }
        }
      }
    }

    this.client.logger.log("[ • ] Website Routes Loaded:");
  }
};
