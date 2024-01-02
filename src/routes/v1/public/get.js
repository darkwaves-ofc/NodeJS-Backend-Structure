"use strict";
const express = require("express");
const router = express.Router();
const dashboardDataDb = require("../../../schema/dashboard");
const membersDataDb = require("../../../schema/members");
const eventDataDb = require("../../../schema/eventData");
const userData = require("../../../schema/userData");
const houseDataDb = require("../../../schema/houses");
const eventTypesDb = require("../../../schema/eventTypes");

class route {
  constructor(client) {
    router.get("/public/data/:type", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const { type } = req.params;
      const payload = {};

      switch (type) {
        case "info":
          try {
            // Get counts for members, events, houses, and accounts
            const [memberCount, eventCount, housesCount, usersCount] =
              await Promise.all([
                membersDataDb.count(),
                eventDataDb.count(),
                houseDataDb.count(),
                userData.count(),
              ]);

            // Prepare information object
            const info = [
              { id: 1, title: "Total Members", count: memberCount },
              { id: 2, title: "Total Events", count: eventCount },
              { id: 3, title: "Total Houses", count: housesCount },
              { id: 4, title: "Total Accounts", count: usersCount },
            ];

            payload.info = info;
            return res.status(200).json({ message: "ok", payload });
          } catch (error) {
            console.error(error);
            return notFoundError("Error occurred", 500, error);
          }

        case "scoreBoard":
          try {
            const eventTypes = await eventTypesDb.find();
            const eventDataSchema = await eventDataDb.find();
            const scoreBoard = eventDataSchema
              .filter((event) => event.state === "approved")
              .map((event) => ({
                eventType: event.types.map((type) => ({ option: type.option })),
                eventName: event.name,
                inputType: event.inputType,
                places: event.places.map((place) => ({
                  house: place.house,
                  place: place.place,
                  score: place.minimumMarks,
                  member: place.name,
                  MemberID: place.inputID,
                })),
              }));

            return res
              .status(200)
              .json({ message: "ok", payload: { scoreBoard, eventTypes } });
          } catch (error) {
            console.error(error);
            return notFoundError("Error occurred", 500, error);
          }

        default:
          return res.status(200).json({ message: "ok", payload });
      }
    });

    return router;
  }
}
module.exports = { route: route, name: "public-get" };
