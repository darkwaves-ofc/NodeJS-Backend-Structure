"use strict";

import * as dotenv from "dotenv";

dotenv.config();

interface Config {
  mongourl: string | undefined;
  website: {
    links: string[];
    fontendUri: string | undefined;
    port: string | undefined;
    clientId: string | undefined;
    clientSecret: string | undefined;
    redirectUri: string;
    secretKey: string | undefined;
    callBackUri: string | undefined;
  };
  loadDefaultIps: boolean;
  cacheToken: string | undefined;
  geoLocationApiKey: string | undefined;
  rabbitMQ: string | undefined;
  database: {
    DashboardData: { name: string }[];
  };
}

function parseBoolean(value: any): boolean {
  if (typeof value === "string") {
    value = value.trim().toLowerCase();
  }
  switch (value) {
    case true:
    case "true":
      return true;
    default:
      return false;
  }
}

const config: Config = {
  mongourl: process.env.MONGO_URI,
  website: {
    links: process.env.Link ? process.env.Link.split(",") : [],
    fontendUri: process.env.fontEndUri,
    port: process.env.Port,
    clientId: process.env.ClientId,
    clientSecret: process.env.ClientSecret,
    redirectUri: "",
    secretKey: process.env.SecretKey,
    callBackUri: process.env.CallBackUri,
  },
  loadDefaultIps: parseBoolean(process.env.LoadDefaults),
  cacheToken: process.env.CacheToken,
  geoLocationApiKey: process.env.geoLocationAPiKey,
  rabbitMQ: process.env.RabbitMQURL,
  database: {
    DashboardData: [{ name: "admin" }],
  },
};

export = config;