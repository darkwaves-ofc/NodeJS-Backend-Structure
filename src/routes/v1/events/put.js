"use strict";
const express = require("express");
const router = express.Router();
const userDataDb = require("../../../schema/userData.js");
const eventDatadb = require("../../../schema/eventData.js");
const eventTypesDb = require("../../../schema/eventTypes.js");

class route {
  constructor(client) {
    router.put("/events", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { eventData } = req.body;
      console.log(eventData);
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      const tokenUserData = await client.findUser(token, req.secret);

      if (!tokenUserData) {
        return notFoundError(`You are not logged into the system`, 400);
      }

      const { name, description, places, types, inputType } = eventData;
      if (!name) return notFoundError("Name is required", 404);
      if (!places || !places.length)
        return notFoundError("Places are required", 404);
      if (!types || !types.length)
        return notFoundError("Types are required", 404);
      if (!inputType) {
        return notFoundError("Input Type is reaqured!", 400);
      }
      const tmpTypes = [];
      for (const type of types) {
        if (!type._id) {
          return notFoundError("Type ID is required", 404);
        }
        const typeSchema = await eventTypesDb
          .findOne({ _id: type._id })
          .catch(() => {});
        if (!typeSchema) return notFoundError("Type not found", 404);

        const selectedOption = typeSchema.options.find(
          (option) => option._id.toString() === type.option,
        );

        if (selectedOption) {
          tmpTypes.push({
            _id: type._id,
            option: type.option,
            selection: selectedOption.option,
          });
        }
      }
      const tmpPlaces = [];
      for (const place of places) {
        if (!place.place || !place.minimumMarks) {
          return notFoundError("Places and Minimum Marks are required", 404);
        }
        tmpPlaces.push({
          place: place.place,
          minimumMarks: place.minimumMarks,
        });
      }

      if (
        !(
          tokenUserData.roles.roleType === "owner" ||
          tokenUserData.roles.roleType === "admin"
        )
      ) {
        return notFoundError(
          "You don't have permissions to execute this command",
          400,
        );
      }

      const eventSchema = new eventDatadb({
        name,
        description,
        places: tmpPlaces,
        types: tmpTypes,
        inputType,
      });

      await eventSchema.save();

      return res.status(200).json({ message: "ok", eventSchema });
    });

    return router;
  }
}

module.exports = { route: route, name: "events-put" };
