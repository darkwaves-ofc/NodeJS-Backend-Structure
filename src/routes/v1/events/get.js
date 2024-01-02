"use strict";

const CircularJSON = require("circular-json");
const eventTypesDb = require("../../../schema/eventTypes.js");

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const filterData = require("../../../utils/filterData.js");
    const userDataDb = require("../../../schema/userData.js");
    const eventData = require("../../../schema/eventData.js");
    const { Types } = require("mongoose");

    router.get("/events/public", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const events = CircularJSON.parse(
        CircularJSON.stringify((await eventData.find().catch(() => {})) || {}),
      );
      for (const event of events) {
        const eventType = await eventTypesDb
          .findOne({ _id: event.type })
          .catch(() => {});
        if (!eventType) continue;
        event.type = { name: eventType.name, _id: eventType._id };
      }
      if (!events) {
        return notFoundError("Cannot find the events", 400);
      }
      return res.status(200).json({ message: "ok", events });
    });

    /**Getting All the events */
    router.get("/events", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError(`You are not logged to the system`, 400);
      }

      const events = CircularJSON.parse(
        CircularJSON.stringify((await eventData.find().catch(() => {})) || {}),
      );

      if (!events) {
        return notFoundError("Cannot find the events", 400);
      }
      return res.status(200).json({ message: "ok", events });
    });

    router.get("/event/:eventId", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { eventId } = req.params;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError(`You are not logged to the system`, 400);
      }
      const event = CircularJSON.parse(
        CircularJSON.stringify(
          (await eventData.findOne({ _id: eventId }).catch(() => {})) || {},
        ),
      );

      if (!Object.keys(event).length) {
        return notFoundError("Cannot find the event", 400);
      }
      const eventType = await eventTypesDb.findOne({ _id: event.type });
      event.type = { name: eventType.name };

      return res.status(200).json({ message: "ok", event });
    });

    router.get("/events/submitted", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError(`You are not logged to the system`, 400);
      }

      if (tokenUserData.roles.roleType !== "owner") {
        return notFoundError("You don't have permissions to access this", 400);
      }

      const events = CircularJSON.parse(
        CircularJSON.stringify(
          (await eventData.find({ state: "pending" }).catch(() => {})) || {},
        ),
      );

      if (!events) {
        return notFoundError("Cannot find the events", 400);
      }

      return res.status(200).json({ message: "ok", events });
    });
    router.get("/events/approved", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError(`You are not logged to the system`, 400);
      }

      if (tokenUserData.roles.roleType !== "owner") {
        return notFoundError("You don't have permissions to access this", 400);
      }

      const events = CircularJSON.parse(
        CircularJSON.stringify(
          (await eventData.find({ state: "approved" }).catch(() => {})) || {},
        ),
      );
      if (!events) {
        return notFoundError("Cannot find the events", 400);
      }
      return res.status(200).json({ message: "ok", events });
    });

    return router;
  }
}
module.exports = { route: route, name: "events-get" };
