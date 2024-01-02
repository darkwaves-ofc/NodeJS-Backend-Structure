"use strict";

import updateSystemSpecs from "../utils/getSystemSpecs";
import { readdir } from "fs";
import { Client } from "./types"; // Replace './types' with the path to your types file

export = class SystemInformation {
  private client: Client;

  constructor(client: Client) {
    if (!client) throw new Error(`client is required`);
    this.client = client;
  }

  public async start() {
    const sendSystemSpecs = async () => {
      if (!this.client.wsevents) return;
      try {
        const specs = await updateSystemSpecs();
        this.client.wsevents.emit("home", { type: "systemInfo", specs });
      } catch (error) {
        console.error("Error fetching system specs:", error);
      }
    };

    setInterval(sendSystemSpecs, 5000);
    this.client.logger.log("[ • ] System information:");
  }
};
