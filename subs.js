import * as cheerio from "cheerio";
import axios from "axios";
import { extractLocation } from "./utils/helpers/apartment-helpers.js";
import updateApartmentData from "./utils/helpers/write-apartment-update.js";
const locationsUrl = [];


const locationsBaseUrl = "https://www.psoas.fi/en/locations/";

const getLocationsNameAndUrl = async () => { // this one give the locs as you know it
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

const getDisplayedVacantApartments = async (apartmentType='all') => { // normal vacant apt page
  const baseUrl = "https://www.psoas.fi/en/apartments";
  const vacantStatusParam = "_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa";
  const apartmentTypes = {
    studio: {
      type: "studio",
      code: "y",
      topic: "vacant/studioapartments",
    },
    family: {
      type: "family",
      code: "p",
      topic: "vacant/familyapartments",
    },
    shared: {
      type: "shared",
      code: "k",
      topic: "vacant/sharedapartments",
    },
  };

  const url = apartmentType == 'all' ? `${baseUrl}/?${vacantStatusParam}`:`${baseUrl}/?_sfm_htyyppi=${apartmentTypes[apartmentType].code}&${vacantStatusParam}`;
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

const getLinkToVacantAppartmentProperties = async (apartmentType='all') => { // this one uses the locs are you know it to get the different links where you will need to navigate to in order to see the vacant green button
  let locationNamesAndUrls = await getLocationsNameAndUrl();
  const displayedVacantApartments = await getDisplayedVacantApartments(apartmentType); // using this so i do not have to go through all the locations blindly just searching for vacant apartments
  const linksToVacantAppartmentProperties = [];

  locationNamesAndUrls = locationNamesAndUrls.slice(0, 15);


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

const getApartmentPropertiesUrl = async (apartmentType='all') => { // this one gives you the url for the different vacant aprtments where you can then go to extract the props
  const locations = await getLinkToVacantAppartmentProperties(apartmentType);
  const vacantApartmentPropertiesUrl = [];

  for (const location of locations) {
    const url = location.url;

    // Add a delay (throttling) between requests
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 2-second delay

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


const extractLocationDetails = async (apartmentType = "all") => {
  const apartmentPropertiesUrl = await getApartmentPropertiesUrl(apartmentType);
  console.log("Apartment properties URL:", apartmentPropertiesUrl);

  const apartmentDetails = [];

  for (const apartment of apartmentPropertiesUrl) {
    console.log("Fetching:", apartment.url);

    // Add a delay (throttling) between requests
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 2-second delay

    const { data } = await axios.get(apartment.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);

    const tableRows = $("table.huoneisto__listaus tbody tr");
    const reserveButton = $(".wp-block-button a").attr("href");
    const addressName = $(".entry-title span").text().trim();
    const addressFull = $(".entry-title").text().replace(addressName, "").trim();
    const imageList = []

    $(".swiper-slide a").each((index, element) => {
      imageList.push(element.attribs.href);
    });

    let propertyObject = {};

    tableRows.each((index, element) => {
      const key = $(element).find("td:first-child").text().trim();
      const value = $(element).find("td:last-child").text().trim();
      let normalizedKey = key.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "");
      propertyObject[normalizedKey] = value;
    });

    propertyObject.reserveButton = reserveButton;
    propertyObject.asun = addressFull;
    propertyObject.parentLocation = apartment.location;
    propertyObject.ownUrl = apartment.url;
    propertyObject.apartmentType = apartmentType;
    propertyObject.images = imageList;

    apartmentDetails.push(propertyObject);
    await updateApartmentData(propertyObject);

  }

  console.log("Apartment details:", apartmentDetails);
  return apartmentDetails;
};

// export { extractLocationDetails };


// Example usage
async function main() {
  await extractLocationDetails('shared');
}

main();
