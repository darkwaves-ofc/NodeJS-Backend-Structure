"use strict";

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const memberData = require("../../../schema/members");
    const houseData = require("../../../schema/houses");

    router.get("/members/public", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const memebrsDataAll = await memberData.find();
      const membersData = [];

      for (let member of memebrsDataAll) {
        const House = await houseData.findOne({ _id: member.House });

        membersData.push({
          Name: member.Name,
          House: House.Name,
          Grade: member.Grade,
          MemberID: member.MemberID,
        });
      }

      // interface MemberData {
      //   _id: string;
      //   Name: string;
      //   House: string;
      //   Grade: string;
      //   MemberID: number;
      // }

      return res.status(200).json({ message: "ok", membersData });
    });

    router.get("/members", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError("You are not logged into the system", 400);
      }
      const memebrsDataAll = await memberData.find();
      const membersData = [];

      for (let member of memebrsDataAll) {
        const House = await houseData.findOne({ _id: member.House });

        membersData.push({
          Name: member.Name,
          House: House.Name,
          Grade: member.Grade,
          MemberID: member.MemberID,
        });
      }
      return res.status(200).json({ message: "ok", membersData });
    });

    router.get("/members/:house", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const { house } = req.params;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError("You are not logged into the system", 400);
      }
      const memebrsDataHouse = await memberData.find({ _id: house });

      return res
        .status(200)
        .json({ message: "ok", membersData: memebrsDataHouse });
    });

    return router;
  }
}
module.exports = { route: route, name: "member-get" };
