"use strict";

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const HouseData = require("../../../schema/houses");

    router.post("/house/:houseID", async (req, res) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { houseID } = req.params;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

      if (!token) {
        return notFoundError(`You are not logged into the system`, 400);
      }

      if (!houseID) {
        return notFoundError(`House ID not found`, 400);
      }

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError("You are not logged into the system", 400);
      }

      if (!(tokenUserData.roles.roleType === "owner")) {
        return notFoundError(
          "You dont have permissions to execute this command",
          400,
        );
      }
      const HouseSchema = await HouseData.findOne({ _id: houseID }).catch(
        (err) => {
          console.log(err);
        },
      );

      if (!HouseSchema) {
        return notFoundError("Cannot find the House", 400);
      }

      HouseSchema.eventData = [];
      HouseSchema.houseScore = 0;

      await HouseSchema.save();

      const AllHouseData = await HouseData.find();

      const wsSendHouseData = [];
      for (const house of AllHouseData) {
        const houseData = {
          _id: house._id,
          houseScore: house.houseScore,
        };
        wsSendHouseData.push(houseData);
      }
      console.log(wsSendHouseData);

      client.wsevents.emit("public", {
        type: "houseScoreUpdate",
        payload: { wsSendHouseData },
      });

      return res.status(200).json({ message: "ok", houseData: HouseSchema });
    });

    return router;
  }
}
module.exports = { route: route, name: "house-post" };
