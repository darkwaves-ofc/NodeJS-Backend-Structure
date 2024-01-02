"use strict";

const CircularJSON = require("circular-json");
const eventTypesDb = require("../../../schema/eventTypes.js");

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const userDataDb = require("../../../schema/userData.js");
    const eventDataDb = require("../../../schema/eventData.js");
    /**Editing a event */
    router.patch("/events/:eventId", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { updatedData = {} } = req.body;
      console.log(updatedData);
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      const { eventId } = req.params;
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
      const eventSchema = await eventDataDb.findOne({ _id: eventId });
      if (!eventSchema) {
        return notFoundError("Cannot find the event", 400);
      }

      const { name, description, places, types, inputType } = updatedData;
      console.log(updatedData);
      if (name) {
        eventSchema.name = name;
      }
      if (description) {
        eventSchema.description = description;
      }
      if (inputType) {
        eventSchema.inputType = inputType;
      }
      if (places) {
        const placesData = [];
        for (const placeData of places) {
          const tmpPlace = {};
          const { place, minimumMarks, _id } = placeData;
          if (!place) return notFoundError("Place number Invaild");
          if (!minimumMarks) return notFoundError("Place minimumMarks Invaild");
          tmpPlace.place = place;
          tmpPlace.minimumMarks = minimumMarks;
          placesData.push(tmpPlace);
        }
        eventSchema.places = placesData;
      }
      if (types && types.length) {
        const tmpTypes = [];
        for (const type of types) {
          const { _id, option } = type;

          const typeSchema = await eventTypesDb
            .findOne({ _id })
            .catch(() => {});
          if (!typeSchema) return notFoundError("Type not found", 404);

          const selectedOption = typeSchema.options.find(
            (opt) => opt._id.toString() === option,
          );

          if (selectedOption) {
            tmpTypes.push({
              _id: _id,
              option: selectedOption._id, // Assuming option here refers to option._id
              selection: selectedOption.option,
            });
          }
        }
        eventSchema.types = tmpTypes;
      }

      await eventSchema.save();

      return res.status(200).json({ message: "ok", eventSchema: eventSchema });
    });

    return router;
  }
}
module.exports = { route: route, name: "events-patch" };
