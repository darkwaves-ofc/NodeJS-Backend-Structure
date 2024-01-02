"use strict";

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const HouseData = require("../../../schema/houses");

    router.put("/house/add", async (req, res) => {
      const notFoundError = function (message, code) {
        return res.status(code).json({ error: true, message });
      };

      try {
        const { houseData = {} } = req.body;

        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

        if (!houseData) {
          return notFoundError("Please enter data to create a house", 400);
        }

        console.log(houseData);

        if (!token) {
          return notFoundError(`You are not logged into the system`, 400);
        }

        const tokenUserData = await client
          .findUser(token, req.secret)
          .catch(() => {});

        if (!tokenUserData) {
          return notFoundError(`You are not logged into the system`, 400);
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
        const { Name, description } = houseData;

        if (!Name) {
          return notFoundError(`Name for House is required`, 400);
        }

        const HouseSchema = await HouseData.findOne({ Name: Name }).catch(
          (err) => {
            console.log(err);
          },
        );

        if (HouseSchema) {
          return notFoundError(`A House with this Name is already`, 400);
        }

        const HouseDataSchema = new HouseData();

        HouseDataSchema.Name = Name;

        if (description) {
          HouseDataSchema.description = description;
        }
        await HouseDataSchema.save();

        return res
          .status(200)
          .json({ message: "ok", houseData: HouseDataSchema });
      } catch (error) {
        console.error("Error", error);
        return res
          .status(500)
          .json({ error: true, message: "Internal Server Error" });
      }
    });

    return router;
  }
}

module.exports = { route: route, name: "house-put" };
