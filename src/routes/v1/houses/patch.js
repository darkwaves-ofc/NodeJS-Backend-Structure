"use strict";

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const HouseData = require("../../../schema/houses");

    router.patch("/house/:houseID", async (req, res) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { houseID } = req.params;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

      if (!token) {
        return notFoundError(`You are already logged into the system`, 400);
      }

      if (!houseID) {
        return notFoundError(`House ID not found`, 400);
      }

      const { updatedHouseData = {} } = req.body;

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError("You are not logged into the system", 400);
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
      const HouseSchema = await HouseData.findOne({ _id: houseID }).catch(
        (err) => {
          console.log(err);
        },
      );

      if (!HouseSchema) {
        return notFoundError("Cannot find the House", 400);
      }
      if (!updatedHouseData) {
        return notFoundError("Enter any House Data for Update", 400);
      }
      const { Name, description } = updatedHouseData;

      let editingHouse = HouseSchema;
      if (Name) {
        editingHouse.Name = Name;
      }
      if (description) {
        editingHouse.description = description;
      }
      await editingHouse.save();

      return res.status(200).json({ message: "ok" });
    });

    return router;
  }
}
module.exports = { route: route, name: "house-patch" };
