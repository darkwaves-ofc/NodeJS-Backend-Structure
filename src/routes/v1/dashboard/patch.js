"use strict";
const express = require("express");
const router = express.Router();
const DashboardData = require("../../../schema/dashboard");

class Route {
  constructor(client) {
    router.patch("/dashboard/:dashboardType", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const { dashboardData = [] } = req.body;
      const { dashboardType } = req.params;
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError(`You are not logged in to the system`, 400);
      }

      if (
        tokenUserData.roles.roleType !== "owner" &&
        tokenUserData.roles.roleType !== "admin"
      ) {
        return notFoundError(
          "You don't have permissions to execute this command",
          400,
        );
      }

      if (!dashboardData || !dashboardData.length) {
        return notFoundError("You haven't entered data for navigations", 400);
      }

      const existingDashboard = await DashboardData.findOne({
        type: dashboardType,
      });

      if (!existingDashboard) {
        return notFoundError(
          `Dashboard type '${dashboardType}' not found`,
          404,
        );
      }

      // Assuming the update format is similar to the creation format
      // Validate and update the received data to the existing dashboard
      existingDashboard.navigationLinks = dashboardData;

      // Save the updated dashboard to the database
      await existingDashboard.save();

      return res
        .status(200)
        .json({ message: "Dashboard data updated successfully" });
    });

    return router;
  }
}

module.exports = { route: Route, name: "dashboard-patch" };
