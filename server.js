import e, { response } from "express";
import fetch from "node-fetch";
import https from "https";
const app = e();
import * as cheerio from "cheerio";

const url =
  "https://www.psoas.fi/en/apartments/?_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa";

// checking is there is internet connection

export const checkInternetConnectivity = () => {
  return new Promise((resolve) => {
    // setTimeout(() => {
    //   console.log("Taking longer than expected, checking internet connection . . .")
    // }, 4000)
    https
      .get("https://www.google.com", (res) => {
        // If we get a response, resolve with true
        resolve(true);
      })
      .on("error", () => {
        // If there is an error, resolve with false
        resolve(false);
      });
  });
};

export async function getVacantApartments() {
  try {
    const response = await fetch(url);
    const $ = cheerio.load(await response.text());
    const vacantApartments = $('option:contains("Vacant apartments")')
      .text()
      .match(/\((\d+)\)/)[1];
    return vacantApartments;
  } catch (error) {
    return error;
  }
}

app.get("/get-vacant-apartment", async (req, res) => {
  const vacantApartments = await getVacantApartments();
  if (vacantApartments) {
    res.send(vacantApartments);
  } else {
    res.send("Error fetching vacant apartments");
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

// app.listen(3000, () => {
//   console.log("Server is running on port 3000");
// });
