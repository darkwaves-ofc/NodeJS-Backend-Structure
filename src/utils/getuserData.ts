import axios from "axios";
import uaParser from "ua-parser-js";
import CircularJSON from "circular-json";
import { Request } from "express";

class GetDetails {
  static async getData(req: Request, client: any) {
    const userAgent = CircularJSON.parse(
      CircularJSON.stringify(uaParser(req.headers["user-agent"])),
    );
    const userIP = req.ip;

    try {
      const response = await axios.get(
        `https://api.ipgeolocation.io/ipgeo?apiKey=${client.config.geoLocationApiKey}&ip=${userIP}`,
      );
      const locationData = response.data;
      return { locationData, userAgent };
    } catch (error) {
      console.error("Error fetching data:", error);
      return { locationData: null, userAgent };
    }
  }
}

export default GetDetails;
