"use strict";
const express = require("express");
const router = express.Router();
const dashboardDataDb = require("../../../schema/dashboard");

class route {
  constructor(client) {
    /**Event creatian */
    router.put("/dashboard/:dashboardType", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const { dashboardData } = req.body;
      const { dashboardType } = req.params;
      const authHeader = req.headers["authorization"];

      const token = authHeader && authHeader.split(" ")[1];
      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError(`You are not logged to the system`, 400);
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
      //   const { staff, admin, owner } = updatedData;
      if (!dashboardData || !dashboardData.length) {
        return notFoundError("You dont have enter data for navigations", 400);
      }
      for (const navigationLinkS of dashboardData) {
        if (!navigationLinkS.title)
          return notFoundError("title is required", 400, navigationLinkS);
        if (!navigationLinkS.icon)
          return notFoundError("icon is required", 400, navigationLinkS);
        if (!navigationLinkS.path)
          return notFoundError("icon is required", 400, navigationLinkS);
        if (!navigationLinkS.url)
          return notFoundError("icon is required", 400, navigationLinkS);
        if (navigationLinkS.subMenu) {
          for (const subMenuLinks of navigationLinkS.subMenu) {
            if (!subMenuLinks.title)
              return notFoundError(
                "submenu title is required",
                400,
                navigationLinkS,
              );
            if (!subMenuLinks.icon)
              return notFoundError(
                "submenu icon is required",
                400,
                navigationLinkS,
              );
            // if (!subMenuLinks.path)
            //   return notFoundError(
            //     "submenu path is required",
            //     400,
            //     navigationLinkS
            //   );
            if (!subMenuLinks.url)
              return notFoundError(
                "submenu url is required",
                400,
                navigationLinkS,
              );
          }
        }
      }

      const dashboardSchema = new dashboardDataDb({
        type: dashboardType,
        navigationLinks: dashboardData,
      });

      await dashboardSchema.save();
      return res.status(200).json({ message: "ok" });
    });

    return router;
  }
}
module.exports = { route: route, name: "dashboard-put" };
