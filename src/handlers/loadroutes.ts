"use strict";

import { readdir } from "fs";

interface Client {
  routes: Map<string, any>;
  logger: any;
}

interface Route {
  version: string;
}

interface Path {
  name: string;
  route: any; // Replace 'any' with an appropriate type based on your route structure
}

export = class RoutesInitializer {
  private client: Client;

  constructor(client: Client) {
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
