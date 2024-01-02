"use strict";
const express = require("express");
const router = express.Router();
const userDataDb = require("../../../schema/userData.js");
const memberData = require("../../../schema/members");
const houseData = require("../../../schema/houses");

class route {
  constructor(client) {
    router.patch("/member/:memId", async (req, res) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { memId } = req.params;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

      if (!token) {
        return notFoundError(`You are already logged into the system`, 400);
      }

      if (!memId) {
        return notFoundError(`Member ID not found`, 400);
      }

      const { updatedMemberData = {} } = req.body;
      console.log(updatedMemberData);
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
      const meberSchema = await memberData
        .findOne({ MemberID: memId })
        .catch(() => {});

      if (!meberSchema) {
        return notFoundError("Cannot find the member", 400);
      }
      const { Name, House, Grade } = updatedMemberData;

      if (Name) {
        meberSchema.Name = Name;
      }
      if (House) {
        // Remove from the current house
        const currentHouseSchema = await houseData.findOne({
          _id: meberSchema.House,
        });
        if (!currentHouseSchema) {
          return notFoundError("Current House Not Found", 404);
        }
        currentHouseSchema.members.remove({
          MemberID: meberSchema.MemberID,
        });

        meberSchema.House = House;

        // Add to the new house
        const newHouseSchema = await houseData.findOne({ Name: House });
        if (!newHouseSchema) {
          return notFoundError("Submitted House not found", 404);
        }
        newHouseSchema.members.push({ MemberID: meberSchema.MemberID });
      }
      if (Grade) {
        meberSchema.Grade = Grade;
      }

      await meberSchema.save();

      return res.status(200).json({ message: "ok" });
    });

    return router;
  }
}
module.exports = { route: route, name: "member-patch" };
