import fetch from "node-fetch";
import https from "https";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import ApartmentModel from "../models/apartment-model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import { scrapeAddresses, readAddressesFromFile } from "./address-scrapper.js";

// Configuration constants
const APARTMENT_TYPES = {
  SHARED: {
    type: "shared",
    code: "k",
    topic: "vacant/sharedapartments",
  },
  STUDIO: {
    type: "studio",
    code: "y",
    topic: "vacant/studioapartments",
  },
  FAMILY: {
    type: "family",
    code: "p",
    topic: "vacant/familyapartments",
  },
};

const BASE_URL = "https://www.psoas.fi/en/apartments";
const VACANT_STATUS_PARAM = "_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class ApartmentScraper {
  /**
   * Generate URL for apartment type
   * @param {string} [apartmentType] - Optional apartment type
   * @returns {string} Constructed URL
   */
  static getUrl(apartmentType) {
    if (!apartmentType) {
      return `${BASE_URL}/?${VACANT_STATUS_PARAM}`;
    }

    const config = APARTMENT_TYPES[apartmentType];
    return `${BASE_URL}/?_sfm_htyyppi=${config.code}&${VACANT_STATUS_PARAM}`;
  }

  /**
   * Check internet connectivity
   * @returns {Promise<boolean>} Connection status
   */
  static checkInternetConnectivity() {
    return new Promise((resolve) => {
      https
        .get("https://www.google.com", () => resolve(true))
        .on("error", () => resolve(false));
    });
  }

  /**
   * Extract vacant apartments count from a given URL
   * @param {string} url - URL to scrape
   * @param {string} [apartmentType] - Optional apartment type for logging
   * @returns {Promise<number|null>} Number of vacant apartments
   */
  static async extractVacantApartments(url, apartmentType) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const response = await fetch(url);
      const $ = cheerio.load(await response.text());
      const vacantText = $('option:contains("Vacant apartments")').text();

      let addresses = await scrapeAddresses(this.getUrl());

      // convert the addresses to an array
      addresses = Array.from(addresses).join('\n');

      // read addresses from a file
      // const addressesFromFile = await readAddressesFromFile("addresses.txt");

      // write the formatted addresses to a file
      // fs.writeFileSync("addresses.txt", addresses);

      // const result = await model.generateContent([
      //   "analyze this text and extract all addresses and return them in an array without duplicates.",
      //   {inlineData: {data: Buffer.from(fs.readFileSync('addresses.txt')).toString("base64"),
      //   mimeType: 'text/plain'}}]
      //   );

      // console.log("Result of address extraction:", result.response.text());


      const match = vacantText.match(/\((\d+)\)/);
      if (match) {
        return parseInt(match[1].trim(), 10);
      }

      console.error(
        `No vacant apartments found for ${
          apartmentType || "all"
        }: ${vacantText}`
      );
      return null;
    } catch (error) {
      console.error(
        `Error fetching ${apartmentType || "all"} apartments:`,
        error
      );
      return null;
    }
  }

  /**
   * Fetch and store vacant apartments data
   */
  static async scrapeVacantApartments() {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];

    try {
      // Fetch total vacant apartments
      const totalVacant = await this.extractVacantApartments(this.getUrl());
      let addresses = await scrapeAddresses(this.getUrl());
      addresses = Array.from(addresses).join('\n');

      // separate the addresses by commas
      addresses = addresses.split('\n').join(', ');

      // Fetch specific apartment type vacancies
      const vacancies = await Promise.all(
        Object.keys(APARTMENT_TYPES).map(async (type) => {
          const count = await this.extractVacantApartments(
            this.getUrl(type),
            type
          );
          return {
            type: APARTMENT_TYPES[type].type,
            count,
          };
        })
      );

      // Prepare data for storage and publishing
      let shared = 0;
      let studio = 0;
      let family = 0;

      // Extract counts for each apartment type
      for (const vacancy of vacancies) {
        const { type, count } = vacancy;
        switch (type) {
          case "shared":
            shared = count;
            break;
          case "family":
            family = count;
            break;
          case "studio":
            studio = count;
            break;
          default:
            break;
        }
      }


      const dataToInsert = {
        type: "vacant",
        count: totalVacant,
        shared,
        studio,
        family,
        date,
        time,
        apartmentType: "ALL",
        addresses,
        url: this.getUrl(),
      };

      // build the apartment model
      const apartment = new ApartmentModel({totalVacantApartments: totalVacant, sharedApartments: shared, familyApartments: family, studioApartments: studio, addresses, link: this.getUrl(), date, time});

      return apartment;

    } catch (error) {
      console.error("Error in scraping process:", error);
    }
  }

  // format the apartment address data
  static formatAddresses(rawData) {
    // Split the raw data into lines, trim each line, and filter out empty ones
    const addresses = rawData
      .split('\n') // Split by line
      .map(line => line.trim()) // Trim whitespace
      .filter(line => line !== ''); // Remove empty lines
  
    // Use a Set to remove duplicates
    const uniqueAddresses = Array.from(new Set(addresses));
  
    return uniqueAddresses;
  }

  
  
}



// Export for use in other modules
export { ApartmentScraper };

// If running as a standalone script
// if (import.meta.url === `file://${process.argv[1]}`) {
//   initApp()
//     .then(() => {
//       ApartmentScraper.scrapeVacantApartments();
//     })
//     .catch(console.error);
// }
