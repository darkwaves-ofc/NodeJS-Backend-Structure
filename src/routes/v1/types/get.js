"use strict";

const CircularJSON = require("circular-json");
const eventTypesDb = require("../../../schema/eventTypes.js");
const express = require("express");
const router = express.Router();
const filterData = require("../../../utils/filterData.js");
const userDataDb = require("../../../schema/userData.js");
const eventData = require("../../../schema/eventData.js");

class route {
  constructor(client) {
    router.get("/event-types", async (req, res, next) => {
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

      const eventsTypes = await eventTypesDb.find();

      if (!eventsTypes) {
        return notFoundError("Cannot find the eventTypes", 400);
      }

      return res.status(200).json({ message: "ok", eventsTypes });
    });

    router.get("/event-types/:typeId", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      const { typeId } = req.params;
      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError(`You are not logged to the system`, 400);
      }

      const eventsTypes = await eventTypesDb.findOne({ _id: typeId });

      if (!eventsTypes) {
        return notFoundError("Cannot find the eventTypes", 400);
      }

      return res.status(200).json({ message: "ok", eventsTypes });
    });

    return router;
  }
}
module.exports = { route: route, name: "event-types-get" };
