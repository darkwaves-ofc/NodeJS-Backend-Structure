"use strict";
const express = require("express");
const router = express.Router();
const dashboardDataDb = require("../../../schema/dashboard");

class route {
  constructor(client) {
    /**Event creatian */
    router.get("/dashboard/:dashboardType", async (req, res, next) => {
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
      if (dashboardType === "all") {
        if (
          !(
            tokenUserData.roles.roleType === "admin" ||
            tokenUserData.roles.roleType === "owner"
          )
        ) {
          return notFoundError(
            "You dont have permissions to get this permissions",
            400,
          );
        }

        const dashboardSchema = await dashboardDataDb.find();

        if (!dashboardSchema) {
          return notFoundError(`data for current role type not found`, 404);
        }

        return res.status(200).json({ message: "ok", data: dashboardSchema });
      }
      if (tokenUserData.roles.roleType !== dashboardType) {
        return notFoundError(
          "You dont have permissions to get this permissions",
          400,
        );
      }

      const dashboardSchema = await dashboardDataDb.findOne({
        type: dashboardType,
      });

      if (!dashboardSchema) {
        return notFoundError(`data for current role type not found`, 404);
      }

      return res.status(200).json({ message: "ok", data: dashboardSchema });
    });

    return router;
  }
}
module.exports = { route: route, name: "dashboard-get" };
