"use strict";

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const filterData = require("../../../utils/filterData.js");
    const userSchme = require("../../../schema/userData.js");

    router.get("/user/:userId", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { userId } = req.params;
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE
      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError("You are not logged into the system", 400);
      }

      let userData = {};

      switch (userId) {
        case "@me": {
          const findingUserData = tokenUserData;

          userData = await new filterData(client).user("@me", findingUserData);
          break;
        }
        case "@all": {
          userData = await userSchme.find({}, { name: 1, _id: 1, roles: 1 });
          break;
        }
        default: {
          userData = await userSchme.findOne(
            { _id: userId },
            { name: 1, _id: 1, roles: 1, userName: 1 },
          );

          break;
        }
      }

      return res.status(200).json({ message: "ok", userData });
    });

    return router;
  }
}
module.exports = { route: route, name: "user-get" };
