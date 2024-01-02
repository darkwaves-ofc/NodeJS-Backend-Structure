"use strict";

import updateSystemSpecs from "../utils/getSystemSpecs";
import { readdir } from "fs";
import { AppTypes } from "../structures/App";

export = class SystemInformation {
  private client: AppTypes;

  constructor(client: AppTypes) {
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
