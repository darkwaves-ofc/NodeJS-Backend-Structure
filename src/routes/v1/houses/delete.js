"use strict";

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const HouseData = require("../../../schema/houses");

    router.delete("/house/:houseId", async (req, res) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { houseId } = req.params;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

      if (!token) {
        return notFoundError(`You are not logged into the system`, 400);
      }

      if (!houseId) {
        return notFoundError(`House ID not found`, 400);
      }

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
      const HouseSchema = await HouseData.findOneAndRemove({
        _id: houseId,
      }).catch(() => {});

      if (!HouseSchema) {
        return notFoundError("Cannot find the House", 400);
      }

      return res.status(200).json({ message: "ok" });
    });

    return router;
  }
}
module.exports = { route: route, name: "house-delete" };
