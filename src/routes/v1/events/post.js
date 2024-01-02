"use strict";
const express = require("express");
const router = express.Router();
const userDataDb = require("../../../schema/userData.js");
const eventDatadb = require("../../../schema/eventData.js");
const memberDatadb = require("../../../schema/members.js");
const houseDatadb = require("../../../schema/houses.js");
const eventTypesDb = require("../../../schema/eventTypes.js");
const CircularJSON = require("circular-json");

class route {
  constructor(client) {
    router.post("/event/:eventID", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      try {
        const { submitdata = {} } = req.body;
        const { eventID } = req.params;
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        const tokenUserData = await client.findUser(token, req.secret);
        if (!tokenUserData) {
          return notFoundError("You are not logged into the system", 400);
        }

        const { places } = submitdata;
        console.log(places);
        const errors = [];
        for (const place of places) {
          if (!place.place || !place.inputID || !place.inputType) {
            return notFoundError(
              "Place, InputType and inputID are required",
              400,
            );
          }
        }

        if (tokenUserData.roles.roleType !== "staff") {
          return notFoundError(
            "You don't have permissions to execute this command",
            400,
          );
        }

        const eventSchema = await eventDatadb.findOne({ _id: eventID });
        if (!eventSchema) {
          return notFoundError("Event not found", 400);
        }
        if (eventSchema.state === "pending") {
          return notFoundError("Event Already submitted", 400);
        }
        if (eventSchema.state === "approved") {
          return notFoundError("Event Already submitted and Approved", 400);
        }
        const submitedEvent = {
          _id: eventSchema._id,
          name: eventSchema.name,
          description: eventSchema.description,
          places: [],
          inputType: eventSchema.inputType,
        };

        for (const place of places) {
          if (!place.place || !place.inputID) {
            errors.push({
              error: true,
              message: "Place and inputID are required",
              place: place.place,
            });
            continue;
          }

          const eventSchemaPlace = eventSchema.places.find(
            (p) => p.place === place.place,
          );
          if (!eventSchemaPlace) {
            errors.push({
              error: true,
              message: "Place not found in the event",
              place: place.place,
            });
            continue;
          }
          if (eventSchema.inputType === "MemberID") {
            const memberDataSchema = await memberDatadb.findOne({
              MemberID: place.inputID,
            });
            if (!memberDataSchema) {
              errors.push({
                error: true,
                message: "Member data not found for the submission",
                place: place.place,
              });
              continue;
            }

            const houseDataSchema = await houseDatadb.findOne({
              _id: memberDataSchema.House,
            });
            if (!houseDataSchema) {
              errors.push({
                error: true,
                message: "House data not found for the submission",
                place: place.place,
              });
              continue;
            }
            eventSchemaPlace.inputID = place.inputID;
            eventSchemaPlace.name = memberDataSchema.Name;
            eventSchemaPlace.house = houseDataSchema.Name;
          } else if (eventSchema.inputType === "HouseName") {
            const houseDataSchema = await houseDatadb.findOne({
              _id: place.inputID,
            });
            if (!houseDataSchema) {
              errors.push({
                error: true,
                message: "House data not found for the submission",
                place: place.place,
              });
              continue;
            }
            eventSchemaPlace.inputID = place.inputID;
            eventSchemaPlace.name = houseDataSchema.Name;
            eventSchemaPlace.house = houseDataSchema.Name;
          }

          submitedEvent.places.push(eventSchemaPlace);
        }

        if (errors.length > 0) {
          return notFoundError("Error occured", 200, errors);
        }

        eventSchema.places = submitedEvent.places;
        eventSchema.state = "pending";
        await eventSchema.save();
        const circularedeventSchema = CircularJSON.parse(
          CircularJSON.stringify(eventSchema),
        );
        console.log(circularedeventSchema);
        client.wsevents.emit("home", {
          type: "eventSubmits",
          payload: circularedeventSchema,
        });

        return res.status(200).json({ message: "ok", submitedEvent });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ error: true, message: "Internal Server Error" });
      }
    });

    router.post("/event/approve/:eventID", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { token } = req.body;
      console.log(token);

      try {
        const { eventID } = req.params;
        const tokenUserData = await client.findUser(token, req.secret);
        if (!tokenUserData) {
          return notFoundError("You are not logged into the system", 400);
        }

        if (tokenUserData.roles.roleType !== "owner") {
          return notFoundError(
            "You don't have permissions to execute this command",
            400,
          );
        }

        const eventSchema = await eventDatadb.findOne({ _id: eventID });
        if (!eventSchema) {
          return notFoundError("Event not found", 400);
        }

        eventSchema.state = "approved";

        if (eventSchema.inputType === "MemberID") {
          for (const place of eventSchema.places) {
            const houseDataSchema = await houseDatadb.findOne({
              Name: place.house,
            });
            houseDataSchema.houseScore += place.minimumMarks;

            const eventDataIndex = houseDataSchema.eventData.findIndex(
              (data) => data.eventId === eventSchema._id.toString(),
            );

            if (eventDataIndex === -1) {
              // If eventData for this eventId doesn't exist, create a new entry
              const eventData = {
                eventId: eventSchema._id.toString(),
                participants: [
                  {
                    userAdmissionId: place.inputID,
                    userName: place.name,
                    marks: place.minimumMarks,
                    place: place.place,
                  },
                ],
              };
              houseDataSchema.eventData.push(eventData);
            } else {
              // If eventData for this eventId exists, add participant details
              houseDataSchema.eventData[eventDataIndex].participants.push({
                userAdmissionId: place.inputID,
                userName: place.name,
                marks: place.minimumMarks,
                place: place.place,
              });
            }

            await houseDataSchema.save();
          }
        } else if (eventSchema.inputType === "HouseName") {
          for (const place of eventSchema.places) {
            const houseDataSchema = await houseDatadb.findOne({
              _id: place.inputID,
            });
            // Add the scores
            houseDataSchema.houseScore += place.minimumMarks;

            const eventDataIndex = houseDataSchema.eventData.findIndex(
              (data) => data.eventId === eventSchema._id.toString(),
            );

            if (eventDataIndex === -1) {
              // If eventData for this eventId doesn't exist, create a new entry
              const eventData = {
                eventId: eventSchema._id.toString(),
              };
              houseDataSchema.eventData.push(eventData);
            }
            await houseDataSchema.save();
          }
        }

        await eventSchema.save();
        const circularedeventSchema = CircularJSON.parse(
          CircularJSON.stringify(eventSchema),
        );
        const AllHouseData = await houseDatadb.find();

        client.wsevents.emit("home", {
          type: "eventApproves",
          payload: { type: "approved", event: circularedeventSchema },
        });
        const wsSendHouseData = [];
        for (const house of AllHouseData) {
          const houseData = {
            _id: house._id,
            houseScore: house.houseScore,
          };
          wsSendHouseData.push(houseData);
        }
        console.log(wsSendHouseData);

        const scoreBoard = {
          eventType: eventSchema.types.map((type) => ({ option: type.option })),
          eventName: eventSchema.name,
          inputType: eventSchema.inputType,
          places: eventSchema.places.map((place) => ({
            house: place.house,
            place: place.place,
            score: place.minimumMarks,
            member: place.name,
            MemberID: place.inputID,
          })),
        };

        client.wsevents.emit("public", {
          type: "houseScoreUpdate",
          payload: { wsSendHouseData },
        });

        client.wsevents.emit("public", {
          type: "eventUpdate",
          payload: { scoreBoard },
        });

        return res.status(200).json({ message: "ok" });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ error: true, message: "Internal Server Error" });
      }
    });

    router.post("/event/reject/:eventID", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const { token } = req.body;
      console.log(token);

      try {
        const { eventID } = req.params;

        const tokenUserData = await client.findUser(token, req.secret);
        if (!tokenUserData) {
          return notFoundError("You are not logged into the system", 400);
        }

        if (tokenUserData.roles.roleType !== "owner") {
          return res.status(400).json({
            error: true,
            message: "You don't have permissions to execute this command",
          });
        }

        const eventSchema = await eventDatadb.findOne({ _id: eventID });
        if (!eventSchema) {
          return res.status(404).json({
            error: true,
            message: "Event not found",
          });
        }
        if (eventSchema.state === "approved") {
          return notFoundError("Event Alread Approved", 400);
        }
        const submitedEvent = {
          _id: eventSchema._id,
          name: eventSchema.name,
          description: eventSchema.description,
          places: [],
        };
        const errors = [];
        for (const place of eventSchema.places) {
          if (!place.place || !place.inputID) {
            errors.push({
              error: true,
              message: "Place and inputID are required",
              place: place.place,
            });
            continue;
          }

          const eventSchemaPlace = eventSchema.places.find(
            (p) => p.place === place.place,
          );
          if (!eventSchemaPlace) {
            errors.push({
              error: true,
              message: "Place not found in the event",
              place: place.place,
            });
            continue;
          }

          eventSchemaPlace.inputID = "";
          eventSchemaPlace.name = "";
          eventSchemaPlace.house = "";
          submitedEvent.places.push(eventSchemaPlace);
        }

        if (errors.length > 0) {
          return notFoundError("Error occured", 200, errors);
        }

        eventSchema.places = submitedEvent.places;
        eventSchema.state = "notSubmitted";
        await eventSchema.save();

        client.wsevents.emit("home", {
          type: "eventApproves",
          payload: { type: "reject", event: eventSchema._id },
        });

        return res.status(200).json({ message: "ok", event: eventSchema._id });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ error: true, message: "Internal Server Error" });
      }
    });

    return router;
  }
}

module.exports = { route: route, name: "events-post" };
