class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const broadcastMessage = require("../../../schema/broadcastMessage");

    // POST Request - Edit Role
    router.get("/broadcast/:type", async (req, res) => {
      const notFoundError = function (message, code) {
        return res.status(code).json({ error: true, message });
      };

      const type = req.params.type;
      if (type === "public") {
        try {
          const publicMessages = await broadcastMessage.find({
            type: "public",
          });
          res.status(200).json({ message: "Ok", messages: publicMessages });
        } catch (error) {
          res
            .status(500)
            .json({ error: true, message: "Internal Server Error" });
        }
      } else if (type === "private") {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE
        try {
          const tokenUserData = await client.findUser(token, req.secret);
          if (!token) {
            return notFoundError("Token is required", 401);
          }
          if (!tokenUserData) {
            return notFoundError("You are not logged into the system", 400);
          }
          if (
            ["staff", "admin", "owner"].includes(tokenUserData.roles.roleType)
          ) {
            const Messages = await broadcastMessage.find({}); // Fetch all messages
            res.status(200).json({ message: "Ok", messages: Messages });
          } else {
            res.status(403).json({
              error: true,
              message: "You don't have permission for this action",
            });
          }
        } catch (error) {
          res
            .status(500)
            .json({ error: true, message: "Internal Server Error" });
        }
      }
    });

    return router;
  }
}
module.exports = { route: route, name: "broadcast-get" };
