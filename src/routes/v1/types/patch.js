"use strict";

const eventTypesDb = require("../../../schema/eventTypes.js");
const express = require("express");
const router = express.Router();
const userDataDb = require("../../../schema/userData.js");
const eventDataDb = require("../../../schema/eventData.js");
class route {
  constructor(client) {
    /**Editing a event */
    router.patch("/event-types/:typeId", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { updatedData = {} } = req.body;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      const { typeId } = req.params;
      console.log(typeId);
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
      const typeSchema = await eventTypesDb
        .findOne({ _id: typeId })
        .catch(() => {});

      if (!typeSchema) {
        return notFoundError("Cannot find the event", 400);
      }

      const { name, options } = updatedData;

      if (name) {
        typeSchema.name = name;
      }
      if (options.length) {
        typeSchema.options = options;
      }

      await typeSchema.save();

      return res.status(200).json({ message: "ok", typeSchema });
    });

    return router;
  }
}
module.exports = { route: route, name: "event-types-patch" };
