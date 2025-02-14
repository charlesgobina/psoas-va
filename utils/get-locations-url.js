import * as cheerio from "cheerio";
import axios from "axios";
import { extractLocation } from "./helpers/apartment-helpers.js";
const locationsUrl = [];

const locationsBaseUrl = "https://www.psoas.fi/en/locations/";

const getLocationsNameAndUrl = async () => {
  try {
    const { data } = await axios.get(locationsBaseUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    // parse data to actual html

    $(".term-list").each((index = 0, element) => {
      // funny enough, this loop goes through just once
      // dealing with this kind of html structure is not the same as dealing with the one on the dom
      // we learn everyday cause I was thinking it was gonna loop through each list ;) but it didn't
      // get element count
      const elementCount = element.children.length;
      // loop through each element
      for (let index = 0; index < elementCount; index++) {
        const locUrl = element.children[index].children[0].attribs.href;
        const locName = element.children[index].children[0].children[0].data;
        locationsUrl.push({ locName, locUrl });
      }
    });

    return locationsUrl;
  } catch (error) {
    console.error("Error scraping locations URL:", error.message);
    return [];
  }
};

const getDisplayedVacantApartments = async () => {
  const url =
    "https://www.psoas.fi/en/apartments/?_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa";
  const vacantApartmentsLocations = [];
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  const $ = cheerio.load(data);

  $(".huoneistohaku__lista__container .card-huoneisto__summary__nimi").each(
    (index, element) => {
      index = 1;
      console.log(
        "Vacant apartments:",
        element.children[index].attribs.onclick
      );
      const loc = extractLocation(element.children[index].attribs.onclick);
      vacantApartmentsLocations.push(loc);
    }
  );

  return vacantApartmentsLocations;
};

const getLinkToVacantAppartmentProperties = async () => {
  const locationNamesAndUrls = await getLocationsNameAndUrl();
  const displayedVacantApartments = await getDisplayedVacantApartments();
  const linksToVacantAppartmentProperties = [];

  // loop through the locations and get the link to the apartment properties
  for (let i = 0; i < locationNamesAndUrls.length; i++) {
    const location = locationNamesAndUrls[i];

    const locationSlug = extractLocation(location.locUrl);

    displayedVacantApartments.forEach((vacantApartment, index) => {
      if (vacantApartment === locationSlug) {
        linksToVacantAppartmentProperties.push({
          location: location.locName,
          url: location.locUrl,
        });
      }
    });
  }

  return linksToVacantAppartmentProperties;
};

const getApartmentPropertiesUrl = async () => {
  const locations = await getLinkToVacantAppartmentProperties();
  const vacantApartmentPropertiesUrl = [];

  for (const location of locations) {
    const url = location.url;

    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const $ = cheerio.load(data);

      $(".card-huoneisto__nappulat a").each((index, element) => {
        if ($(element).text().trim() === "Vacant") {
          vacantApartmentPropertiesUrl.push({
            location: location.location,
            url: element.attribs.href,
          });
        }
      });

    } catch (error) {
      console.error(`Failed to fetch data from ${url}:`, error.message);
    }
  }

  console.log("Vacant apartment properties URL:", vacantApartmentPropertiesUrl);

  return vacantApartmentPropertiesUrl;
};


const extractLocationDetails = async () => {
  const apartmentPropertiesUrl = await getApartmentPropertiesUrl();
  console.log("Apartment properties URL:", apartmentPropertiesUrl);
  const apartmentDetails = [];

  apartmentPropertiesUrl.forEach(async (apartment) => {
    console.log("Apartment:", apartment);
    const url = apartment.url;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);

    const tableRows = $("table.huoneisto__listaus tbody tr");

    // Initialize an object to store extracted data
    let propertyObject = {};

    // Iterate through each row
    tableRows.each((index, element) => {
      const key = $(element).find("td:first-child").text().trim();
      const value = $(element).find("td:last-child").text().trim();

      // Handle special cases like property names with spaces or non-standard keys
      // For example, normalize 'Place for a washing machine' to 'washingMachinePlace'
      let normalizedKey = key.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "");

      // Store data in the object
      propertyObject[normalizedKey] = value;

      // Store the location of the apartment
      console.log(propertyObject);
    });
  });

};

// Example usage
async function main() {
  await extractLocationDetails();
}

main();
