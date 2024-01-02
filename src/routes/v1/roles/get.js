class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const userDataDb = require("../../../schema/userData");

    // POST Request - Edit Role
    router.get("/role", async (req, res) => {
      const notFoundError = function (message, code) {
        return res.status(code).json({ error: true, message });
      };

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

      if (!token) {
        return notFoundError("Token is required", 401);
      }

      try {
        const tokenUserData = await client.findUser(token, req.secret);
        if (!tokenUserData) {
          return notFoundError("You are not logged into the system", 400);
        }

        const requesterRole = tokenUserData.roles.roleIndex;

        // Query database for users with a lower roleIndex
        const lowerRoleUsers = await userDataDb.find({
          "roles.roleIndex": { $gt: requesterRole },
        });

        // Debug: Log the result
        const destrucuredData = lowerRoleUsers.map((object) => ({
          id: object._id,
          userName: object.userName,
          name: object.name,
          role: object.roles.roleType,
        }));

        // Respond with the users found
        res.status(200).json({ message: "Ok", lowerUsers: destrucuredData });
      } catch (error) {
        console.error("Error in GET /role:", error);
        res.status(500).json({ error: true, message: "Internal Server Error" });
      }
    });

    router.get("/role/access", async (req, res) => {
      const notFoundError = function (message, code) {
        return res.status(code).json({ error: true, message });
      };

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

      if (!token) {
        return notFoundError("Token is required", 401);
      }

      try {
        const tokenUserData = await client.findUser(token, req.secret);
        if (!tokenUserData) {
          return notFoundError("You are not logged into the system", 400);
        }

        const requesterRole = tokenUserData.roles.roleIndex;

        // Query database for users with a lower roleIndex
        const lowerRoleUsers = await userDataDb.find({
          "roles.roleIndex": { $gt: requesterRole },
        });

        const lowerRoles = [];
        const allRoles = [
          { roleType: "Owner", roleIndex: 1 },
          { roleType: "Admin", roleIndex: 2 },
          { roleType: "Staff", roleIndex: 3 },
        ];
        for (const role of allRoles) {
          console.log("role", role);
          console.log("requesterRole", requesterRole);
          if (role.roleIndex > requesterRole) {
            lowerRoles.push(role);
          }
        }
        // Debug: Log the result
        // Respond with the users found
        res.status(200).json({ message: "Ok", lowerRoles });
      } catch (error) {
        console.error("Error in GET /role:", error);
        res.status(500).json({ error: true, message: "Internal Server Error" });
      }
    });

    return router;
  }
}
module.exports = { route: route, name: "role-get" };
