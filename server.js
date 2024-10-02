import e, { response } from "express";
import fetch from "node-fetch";
import https from "https";
const app = e();
import * as cheerio from "cheerio";


const apartmentType = {
  shared: "k",
  studio: "y",
  family: "p",
};


const baseUrl = "https://www.psoas.fi/en/apartments";
const vacantUrl = `${baseUrl}/?_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa`;
const sharedUrl = `${baseUrl}/?_sfm_htyyppi=${apartmentType.shared}&_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa`;
const studioUrl = `${baseUrl}/?_sfm_htyyppi=${apartmentType.studio}&_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa`;
const familyUrl = `${baseUrl}/?_sfm_htyyppi=${apartmentType.family}&_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa`;


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
    const response = await fetch(vacantUrl);
    const $ = cheerio.load(await response.text());
    const vacantApartments = $('option:contains("Vacant apartments")')
      .text()
      .match(/\((\d+)\)/)[1];
    return vacantApartments;
  } catch (error) {
    return error;
  }
}

// get vacant shared apartments
export async function getVacantSharedApartments() {
  try {
    const response = await fetch(sharedUrl);
    const $ = cheerio.load(await response.text());
    const vacantApartments = $('option:contains("Vacant apartments")')
      .text()
      .match(/\((\d+)\)/)[1];
    return vacantApartments;
  } catch (error) {
    return error;
  }
}

// get vacant studio apartments
export async function getVacantStudioApartments() {
  try {
    const response = await fetch(studioUrl);
    const $ = cheerio.load(await response.text());
    const vacantApartments = $('option:contains("Vacant apartments")')
      .text()
      .match(/\((\d+)\)/)[1];
    return vacantApartments;
  } catch (error) {
    return error;
  }
}

// get vacant family apartments
export async function getVacantFamilyApartments() {
  try {
    const response = await fetch(familyUrl);
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
