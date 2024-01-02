"use strict";
const express = require("express");
const router = express.Router();
const memberData = require("../../../schema/members");
const HouseData = require("../../../schema/houses");

class route {
  constructor(client) {
    router.put("/members/add", async (req, res) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      try {
        const { members = [] } = req.body;

        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

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
          tokenUserData.roles.roleType !== "owner" &&
          tokenUserData.roles.roleType !== "admin"
        ) {
          return notFoundError(
            "You dont have permissions to execute this command",
            400,
          );
        }

        if (!members || !Array.isArray(members) || members.length === 0) {
          return notFoundError(`No valid member data provided`, 400);
        }
        const errors = [];
        const membersDummyDataArray = [];
        const tempIds = [];
        for (const member of members) {
          const { Name, House, Grade } = member;

          const MemberID = isNaN(member.MemberID)
            ? parseInt(member.MemberID)
            : member.MemberID;

          if (isNaN(MemberID)) {
            errors.push({
              error: true,
              message: `are you high nigga`,
              data: MemberID,
            });
            continue;
          }
          const isAlready = tempIds.find((id) => id === MemberID);
          if (isAlready) {
            errors.push({
              error: true,
              message: `MemberID ${MemberID} is already in your submits`,
              data: MemberID,
            });
            continue;
          }
          tempIds.push(MemberID);
          const houseSchema = await HouseData.findOne({ Name: House });

          if (!houseSchema) {
            errors.push({
              error: true,
              message: `House is not found`,
              data: MemberID,
            });
            continue;
          }

          const memberSchema = await memberData
            .findOne({ MemberID })
            .catch((err) => {
              console.log(err);
            });

          if (memberSchema) {
            errors.push({
              error: true,
              message: `MemberID ${MemberID} is already in the database`,
              data: MemberID,
            });
            continue;
          }

          const memberDataDummy = {};
          if (!Name || !houseSchema.Name || !Grade || !MemberID) {
            errors.push({
              error: true,
              message: `All fields (name, house, grade, MemberID) are required`,
              data: MemberID,
            });
            continue;
          }

          memberDataDummy.Name = Name;
          memberDataDummy.House = houseSchema._id;
          memberDataDummy.Grade = Grade;
          memberDataDummy.MemberID = MemberID;

          membersDummyDataArray.push(memberDataDummy);
        }

        if (errors.length > 0) {
          return notFoundError("Error occurred", 200, errors);
        }

        // Save Data If Not Any Errors
        const tmpMemberArray = [];
        for (const data of membersDummyDataArray) {
          const memberDataSchema = new memberData(data);
          const houseSchema = await HouseData.findOne({ _id: data.House });
          const houseNameUser = houseSchema.members.find(
            (user) => user.MemberID === data.MemberID,
          );
          tmpMemberArray.push({
            Name: data.Name,
            House: houseSchema.Name,
            Grade: data.Grade,
            MemberID: data.MemberID,
          });
          if (!houseNameUser) {
            houseSchema.memberCount += 1;
            houseSchema.members.push({
              MemberID: data.MemberID,
            });
          }
          data._id = memberDataSchema._id;
          await memberDataSchema.save();
          await houseSchema.save();
        }
        console.log(tmpMemberArray);
        return res
          .status(200)
          .json({ message: "ok", memberData: tmpMemberArray });
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

module.exports = { route: route, name: "member-put" };
