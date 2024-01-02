"use strict";

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const HouseData = require("../../../schema/houses");

    router.get("/houses", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };
      // No Auth becuase no sensitive data...
      const houseDataAll = await HouseData.find();

      return res.status(200).json({ message: "ok", HouseData: houseDataAll });
    });

    return router;
  }
}
module.exports = { route: route, name: "house-get" };
