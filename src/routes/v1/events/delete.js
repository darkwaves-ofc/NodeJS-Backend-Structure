"use strict";

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const userDataDb = require("../../../schema/userData.js");
    const eventDataDB = require("../../../schema/eventData.js");

    /**Event Delete */
    router.delete("/events/:eventId", async (req, res, next) => {
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
      if (
        !(
          tokenUserData.roles.roleType === "owner" ||
          tokenUserData.roles.roleType === "admin"
        )
      ) {
        return notFoundError(
          "You dont have permissions to execute this command",
          400,
        );
      }
      console.log(eventId);
      const eventSchema = await eventDataDB
        .findOneAndDelete({ _id: eventId })
        .catch((err) => {
          console.log(err);
        });
      if (!eventSchema) {
        return notFoundError("Event Not found", 404);
      }
      return res.status(200).json({ message: "ok" });
    });

    return router;
  }
}
module.exports = { route: route, name: "events-delete" };
