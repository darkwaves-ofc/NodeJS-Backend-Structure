"use strict";
const express = require("express");
const router = express.Router();
const dashboardDataDb = require("../../../schema/dashboard");

class route {
  constructor(client) {
    /**Event creatian */
    router.delete("/dashboard/:dashboardType", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const { dashboardType } = req.params;
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError(`You are not logged to the system`, 400);
      }
      if (tokenUserData.roles.roleType !== dashboardType) {
        return notFoundError(
          "You dont have permissions to get this permissions",
          400,
        );
      }

      const dashboardSchema = await dashboardDataDb.deleteOne({
        type: dashboardType,
      });

      return res.status(200).json({ message: "ok" });
    });

    return router;
  }
}
module.exports = { route: route, name: "dashboard-delete" };
