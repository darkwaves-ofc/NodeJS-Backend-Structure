"use strict";
const express = require("express");
const router = express.Router();
const userDataDb = require("../../../schema/userData.js");
const eventDatadb = require("../../../schema/eventData.js");
const eventTypesDb = require("../../../schema/eventTypes.js");

class route {
  constructor(client) {
    /**Event creatian */

    router.put("/event-types", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { eventTypes = {} } = req.body;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError(`You are not logged to the system`, 400);
      }
      console.log(eventTypes);
      const { name, options } = eventTypes;

      if (!name) return notFoundError("Name is required", 404);
      if (!options.length)
        return notFoundError(
          "You must be add lease one option for a type",
          400,
        );
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

      const optionsDummy = [];

      for (const option of options) {
        if (!option || !option.option) {
          return notFoundError("Option Not Found", 404);
        }
        optionsDummy.push({
          option: option.option,
        });
      }

      const evenType = new eventTypesDb({ name, options: optionsDummy });
      console.log(evenType);

      await evenType.save();
      return res.status(200).json({ message: "ok", evenType });
    });
    return router;
  }
}
module.exports = { route: route, name: "event-types-put" };
