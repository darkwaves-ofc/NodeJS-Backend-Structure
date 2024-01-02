"use strict";

import App from "./structures/App";
import colors from "colors";
import os from "os";
import readline from "readline";

const client = new App();

process.on("unhandledRejection", (reason, p) => {
  console.log("\n\n\n\n\n=== unhandled Rejection ===".toUpperCase().yellow.dim);
  console.log(reason);
  console.log("=== unhandled Rejection ===\n\n\n\n\n".toUpperCase().yellow.dim);
});

process.on("uncaughtException", (err: Error, origin: string) => {
  console.log(
    "\n\n\n\n\n\n=== uncaught Exception ===".toUpperCase().yellow.dim
  );
  console.log("Exception: ", err.stack ? err.stack : err);
  console.log("=== uncaught Exception ===\n\n\n\n\n".toUpperCase().yellow.dim);
});

process.on("uncaughtExceptionMonitor", (err: Error, origin: string) => {
  console.log("=== uncaught Exception Monitor ===".toUpperCase().yellow.dim);
});

process.on("beforeExit", (code: number) => {
  console.log("\n\n\n\n\n=== before Exit ===".toUpperCase().yellow.dim);
  console.log("Code: ", code);
  console.log("=== before Exit ===\n\n\n\n\n".toUpperCase().yellow.dim);
});

process.on("exit", (code: number) => {
  console.log("\n\n\n\n\n=== exit ===".toUpperCase().yellow.dim);
  console.log("Code: ", code);
  console.log("=== exit ===\n\n\n\n\n".toUpperCase().yellow.dim);
});

process.on("multipleResolves", (type, promise, reason) => {
  // Do something for multipleResolves event
});

function getIPv4Addresses(): string | undefined {
  const networkInterfaces = os.networkInterfaces();
  let ipv4Address: string | undefined;

  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaceInfo = networkInterfaces[interfaceName];
    if (interfaceInfo) {
      interfaceInfo.forEach((info) => {
        if (info.family === "IPv4" && info.internal === false) {
          ipv4Address = info.address;
        }
      });
    }
  });

  return ipv4Address;
}

const ipv4Address = `http://${getIPv4Addresses()}`;
const ips = [...client.config.website.links, ipv4Address, "All"];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

new Promise<void>((resolve) => {
  if (client.config.loadDefaultIps) return resolve();

  console.log(colors.yellow.bold(`What is Your Ip: \n`));
  ips.forEach((value, i) => {
    console.log(
      colors.yellow.bold(
        `${i + 1}.${
          value === "All"
            ? `${value}`
            : `${value}:${client.config.website.port}`
        }`
      )
    );
  });
  console.log(colors.yellow.bold(`Or just press enter to go with env ips \n`));

  rl.question(`Type The Number [?]: `, (userRes: string) => {
    const selectedOption = parseInt(userRes, 10);

    if (
      !isNaN(selectedOption) &&
      selectedOption >= 1 &&
      selectedOption <= ips.length
    ) {
      const ip = ips[selectedOption - 1];
      if (ip !== "All") {
        client.config.website.links = [ip];
      } else {
        ips.splice(ips.indexOf("All"), 1);
        client.config.website.links = ips;
      }
    }

    const allips = client.config.website.links.map((val) => {
      return (val = `${val}:${client.config.website.port}`);
    });

    console.log(colors.yellow.bold(`Your Ips Are ${allips.join(` , `)}\n`));
    rl.close();
    resolve();
  });
}).then(() => {
  client.connect();
});

export = client;
