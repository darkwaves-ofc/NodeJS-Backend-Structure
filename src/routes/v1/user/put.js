"use strict";

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const dayjs = require("dayjs");
    const userDataDb = require("../../../schema/userData.js");
    const bcrypt = require("bcrypt");

    router.put("/user", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      const {
        signupData = {
          // email: undefined,
          userName: undefined,
          password: undefined,
          // phoneNumber: undefined,
          // school: undefined,
          name: undefined,
          role: undefined,
        },
      } = req.body;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError(`You are not logged to the system`, 400);
      }
      if (
        !tokenUserData.roles ||
        typeof tokenUserData.roles.roleIndex === "undefined"
      ) {
        return notFoundError(`You're role information is incomplete`, 400);
      }

      const roleHierarchy = {
        3: "Staff",
        2: "Admin",
        1: "Owner",
      };

      // Validate the role of the user to be created

      const { userName, password, name, role } = signupData;
      console.log(signupData);
      const userSchema = new userDataDb();
      if (!userName) {
        return notFoundError(`userName is required`, 400);
      } else {
        if (await userDataDb.findOne({ userName }).catch(() => {})) {
          return notFoundError(
            `This userName already exits on the database`,
            400,
          );
        }
        userSchema.userName = userName;
      }
      if (!password) {
        return notFoundError(`password is required`, 400);
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        userSchema.password = hashedPassword;
      }
      if (!name) {
        return notFoundError(`name is required`, 400);
      } else {
        userSchema.name = name;
      }
      if (!role) {
        return notFoundError(`role is required`, 400);
      } else {
        const newUserRoleIndex = roleHierarchy[role];

        if (newUserRoleIndex <= tokenUserData.roles.roleIndex) {
          return notFoundError(
            "You cannot create a user with equal or higher role",
            403,
          );
        }
        console.log({ roleType: newUserRoleIndex, roleIndex: role });
        userSchema.roles = {
          roleType: newUserRoleIndex,
          roleIndex: role,
        };
      }
      const jwtToken = client.jwt.sign(
        {
          uuid: userSchema._id.toString(),
        },
        client.config.website.secretKey,
      );
      console.log(userSchema);

      await userSchema.save();

      // client.emitGlobalEvents("userCreate", {
      //   id: editingUser._id,
      // });
      const updatedUserData = {
        role: userSchema.roles.roleType,
        id: userSchema._id,
        name: userSchema.name,
        userName: userSchema.userName,
      };

      return res
        .status(200)
        .json({ message: "ok", userSchema: updatedUserData });
    });

    return router;
  }
}
module.exports = { route: route, name: "user-put" };
