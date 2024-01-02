class Route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const userDataDb = require("../../../schema/userData.js");
    const memberData = require("../../../schema/members");
    const HouseData = require("../../../schema/houses.js");

    router.delete("/member/:memId", async (req, res) => {
      try {
        let { memId } = req.params;
        memId = parseInt(memId); // Convert memId to integer

        if (isNaN(memId)) {
          return res
            .status(400)
            .json({ error: true, message: "Invalid Member ID format" });
        }

        if (!memId) {
          return res
            .status(400)
            .json({ error: true, message: "Member ID not found" });
        }

        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

        if (!token) {
          return res.status(400).json({
            error: true,
            message: "You are not logged into the system",
          });
        }

        const tokenUserData = await client
          .findUser(token, req.secret)
          .catch(() => {});

        if (!tokenUserData) {
          return res.status(400).json({
            error: true,
            message: "You are not logged into the system",
          });
        }

        if (
          !(
            tokenUserData.roles.roleType === "owner" ||
            tokenUserData.roles.roleType === "admin"
          )
        ) {
          return res.status(400).json({
            error: true,
            message: "You don't have permissions to execute this command",
          });
        }
        const memberToRemove = await memberData.findOneAndDelete({
          MemberID: memId,
        });

        if (!memberToRemove) {
          return res
            .status(400)
            .json({ error: true, message: "Cannot find the member" });
        }

        const houseContainingMember = await HouseData.findOne({
          _id: memberToRemove.House,
        });

        if (!houseContainingMember) {
          return res
            .status(400)
            .json({ error: true, message: "House Not Found" });
        }

        const houseMemberIndex = houseContainingMember.members.findIndex(
          (member) => member.MemberID === memId,
        );

        if (houseMemberIndex === -1) {
          return res
            .status(404)
            .json({ error: true, message: "Member Not found in the house" });
        }

        houseContainingMember.members.splice(houseMemberIndex, 1);

        // Save changes to the house containing the member
        await houseContainingMember.save();

        return res.status(200).json({ message: "ok" });
      } catch (error) {
        console.log(error);
        return res
          .status(500)
          .json({ error: true, message: "Internal server error" });
      }
    });

    return router;
  }
}

module.exports = { route: Route, name: "member-delete" };
