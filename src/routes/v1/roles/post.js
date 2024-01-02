class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const userDataDb = require("../../../schema/userData");

    router.post("/role", async (req, res) => {
      const {
        newRole = {
          targetUser: undefined,
          roleType: undefined,
        },
      } = req.body;

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

      const roleHierarchy = {
        staff: 3,
        admin: 2,
        owner: 1,
      };

      try {
        const userSchema = await userDataDb.findOne({
          _id: newRole.targetUser,
        });

        if (!userSchema) {
          return notFoundError(
            "Fetching userSchema Error or The User With UserID not Found",
            400,
            newRole.targetUser,
          );
        }
        if (!tokenUserData.roles) {
          return notFoundError("Users Not Found in your data", 400);
        }
        if (!userSchema.roles) {
          return notFoundError("Users Not Found in requested data", 400);
        }
        const requesterRoleIndex = tokenUserData.roles.roleIndex;
        const targetRoleIndex = userSchema.roles.roleIndex;

        if (
          requesterRoleIndex >= targetRoleIndex ||
          requesterRoleIndex >= roleHierarchy[newRole.roleType]
        ) {
          return notFoundError(
            "Insufficient permissions to edit this role.",
            400,
            {
              "Max Requester Role Index than target userRole":
                requesterRoleIndex < targetRoleIndex,
              "Max Requester Role Index than target Role":
                requesterRoleIndex < roleHierarchy[newRole.roleType],
            },
          );
        }
        userSchema.roles.roleType = newRole.roleType;
        userSchema.roles.roleIndex = roleHierarchy[newRole.roleType];

        await userSchema.save();
        res.status(200).json({ message: "Role updated successfully" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }
}
module.exports = { route: route, name: "role-post" };
