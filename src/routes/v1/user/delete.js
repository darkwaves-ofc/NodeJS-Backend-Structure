"use strict";

const { truncate } = require("fs/promises");
const userDataDB = require("../../../schema/userData");

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();

    router.delete("/user/:userId", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

      const { userId } = req.params;

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError("You are not logged into the system", 400);
      }
      let findingUserData;
      if (userId === "@me" || String(tokenUserData._id) === userId) {
        findingUserData = await userDataDB.findOne({ _id: userId });
      } else {
        findingUserData = await userDataDB.findOne({ _id: userId });

        if (!findingUserData) {
          return notFoundError("Cannot find the user", 400);
        }
      }

      // Assuming 'delete' is a method you have defined in your schema, you should use 'deleteOne' or 'remove'
      await findingUserData.deleteOne();

      return res.status(200).json({ message: "ok" });
    });

    // router.delete("/user/:userId/auth", async (req, res, next) => {
    //   const notFoundError = function (message, code, data) {
    //     return res.status(code).json({ error: true, message, data });
    //   };
    //   const { token } = req.body;
    //   const { userId } = req.params;
    //   const { tokenId } = req.query;

    //   const tokenUserData = await client
    //     .findUser(token, req.secret)
    //     .catch(() => {});

    //   if (!tokenUserData)
    //     return notFoundError("You are not logged into the system", 400);

    //   const { userSchema } = await client.users
    //     .getFetch(tokenUserData._id)
    //     .catch(() => {});

    //   if (!userSchema) {
    //     return notFoundError("Cannot find the user", 400);
    //   }

    //   let editingUser;

    //   switch (userId === "@me" || String(tokenUserData._id) === userId) {
    //     case true: {
    //       const findingUserData = userSchema;
    //       editingUser = findingUserData;
    //       break;
    //     }
    //     case false: {
    //       const findingUserData = await
    //       // const { userSchema: findingUserData } = await client.users
    //       //   .getFetch(tokenUserData._id)
    //       //   .catch(() => {});

    //       if (!findingUserData) {
    //         return notFoundError("Cannot find the user", 400);
    //       }

    //       editingUser = findingUserData;

    //       if (editingUser.owner) {
    //         return notFoundError(
    //           "This user is the owner of this platform",
    //           400
    //         );
    //       }

    //       if (!userSchema.owner) {
    //         const editingUserHeighestFlag = await new permissionCalculator()
    //           .getHighestFlag(editingUser)
    //           .catch(() => {});
    //         const userSchemaHeighestFlag = await new permissionCalculator()
    //           .getHighestFlag(userSchema)
    //           .catch(() => {});
    //         if (
    //           editingUserHeighestFlag.flag.position <=
    //           userSchemaHeighestFlag.flag.position
    //         ) {
    //           return notFoundError(
    //             "Editing user has a higher flag than you or equal to you",
    //             400
    //           );
    //         }
    //       }

    //       if (
    //         !(await new permissionCalculator()
    //           .hasPermission(userSchema, "MANAGE_USERS")
    //           .catch(() => {}))
    //       ) {
    //         return notFoundError(
    //           "You dont have permissions to execute this command",
    //           400
    //         );
    //       }
    //       break;
    //     }
    //   }

    //   const removingToken =
    //     editingUser.tokens.find(
    //       (tokenSchema) => String(tokenSchema._id) === tokenId
    //     ) ||
    //     editingUser.tokens.find((tokenSchema) => tokenSchema.token === token);

    //   editingUser.tokens = editingUser.tokens.filter(
    //     (tokenSchema) => tokenSchema.token !== removingToken.token
    //   );

    //   await editingUser.save();

    //   client
    //     .emitGlobalEvents("checkLogin", {
    //       token: removingToken.token,
    //       id: editingUser._id,
    //     })
    //     .catch(() => {});

    //   return res.status(204);
    // });

    return router;
  }
}
module.exports = { route: route, name: "user-delete" };
