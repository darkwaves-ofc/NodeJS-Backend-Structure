"use strict";

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const userDataDb = require("../../../schema/userData");
    const bcrypt = require("bcrypt");

    router.post("/user/auth", async (req, res) => {
      const notFoundError = function (message, code) {
        return res.status(code).json({ error: true, message });
      };

      try {
        const { loginData = {} } = req.body;
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

        const tokenUserData = await client
          .findUser(token, req.secret)
          .catch(() => {});

        if (tokenUserData) {
          return notFoundError(`You are already logged into the system`, 400);
        }

        const { userName, password } = loginData;
        if (!userName) {
          return notFoundError(`userName is required`, 400);
        }
        if (!password) {
          return notFoundError(`password is required`, 400);
        }

        // Find user by userName
        const userSchema = await userDataDb
          .findOne({ userName: userName })
          .catch((err) => {
            console.log(err);
          });
        if (!userSchema) {
          return notFoundError(`userName is not found`, 400);
        }

        if (userSchema.deleted) {
          return notFoundError(`User account is not active`, 400);
        }
        // Verify the password
        const isPasswordValid = await bcrypt.compare(
          password,
          userSchema.password,
        );

        // const isPasswordValid = (password ===  userSchema.password)

        if (!isPasswordValid) {
          return notFoundError(`userName or password is invalid`, 400);
        }

        const jwtToken = client.jwt.sign(
          {
            uuid: userSchema._id.toString(),
          },
          client.config.website.secretKey,
        );

        userSchema.tokens.push({
          token: jwtToken,
        });

        await userSchema.save();

        return res.status(200).json({ message: "ok", token: jwtToken });
      } catch (error) {
        console.error("Error in /user/auth:", error);
        return res
          .status(500)
          .json({ error: true, message: "Internal Server Error" });
      }
    });

    return router;
  }
}

module.exports = { route: route, name: "user-post" };
