import * as cheerio from "cheerio";
import axios from "axios";
import { extractLocation, extractSpecificSlug, extractPrice, extractRooms, extractSize } from "./helpers/apartment-helpers.js";
import pLimit from "p-limit";

const locationsUrl = [];

const locationsBaseUrl = "https://www.psoas.fi/en/locations/";

const transformText = (text) => {
  return text.replace(/[':]/g, '');
};

const getLocationsNameAndUrl = async () => {
  // this one give the locs as you know it
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

const getDisplayedVacantApartments = async (apartmentType = "all") => {
  // normal vacant apt page
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

  const url =
    apartmentType == "all"
      ? `${baseUrl}/?${vacantStatusParam}`
      : `${baseUrl}/?_sfm_htyyppi=${apartmentTypes[apartmentType].code}&${vacantStatusParam}`;
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

const extractApartmentDetails = async (apartment, apartmentType = "all") => {
  const apartmentDetails = [];

  console.log("Fetching:", apartment.locUrl);

  // Add a delay (throttling) between requests
  // await new Promise((resolve) => setTimeout(resolve, 1500)); // 2-second delay

  const { data } = await axios.get(apartment.locUrl, {
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
  const imageList = [];

  $(".swiper-slide a").each((index, element) => {
    imageList.push(element.attribs.href);
  });

  let propertyObject = {};

  tableRows.each((index, element) => {
    const key = $(element).find("td:first-child").text().trim();
    const value = $(element).find("td:last-child").text().trim();
    let normalizedKey = key
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
    propertyObject[normalizedKey] = value;

    if (normalizedKey === "rent") {
      propertyObject[normalizedKey] = extractPrice(value);
    }
    if (normalizedKey === "rooms") {
      propertyObject[normalizedKey] = extractRooms(value);
    }
    if (normalizedKey === "sizeM2") {
      propertyObject[normalizedKey] = extractSize(value);
    }
  });
  propertyObject[transformText('vacantFrom:')] = propertyObject['vacantFrom:'];
  delete propertyObject['vacantFrom:'];
  propertyObject.reserveButton = reserveButton;
  propertyObject.asun = addressFull;
  propertyObject.parentLocation = apartment.locName;
  propertyObject.ownUrl = apartment.locUrl;
  propertyObject.apartmentType = apartmentType;
  propertyObject.imageList = imageList;

  apartmentDetails.push(propertyObject);

  return propertyObject;
};

const getApartmentPropertiesUrl = async (locations, apartmentTypeFilter = 'all') => {
  const vacantApartmentPropertiesUrl = [];

  for (const location of locations) {
    const url = location.locUrl;

    // Add a delay (throttling) between requests
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay

    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", // Example User-Agent
        },
      });

      const $ = cheerio.load(data);

      $(".card-huoneisto__nappulat a").each((index, element) => {
        const $anchor = $(element); // Create a Cheerio object for the anchor tag

        if ($anchor.text().trim() === "Vacant") {
          // 1. Find the parent apartment card for this "Vacant" button
          const $apartmentCard = $anchor.closest('.card-huoneisto__sublist__item');
          let determinedType = 'unknown'; // Variable to store the type of the current apartment

          if ($apartmentCard.length) {
            // 2. Find the '.swiper-container' ancestor which holds the 'tyyppi-*' class
            const $swiperContainer = $apartmentCard.closest('.swiper-container');
            if ($swiperContainer.length) {
              if ($swiperContainer.hasClass('tyyppi-k')) {
                determinedType = 'shared';
              } else if ($swiperContainer.hasClass('tyyppi-y')) {
                determinedType = 'studio';
              } else if ($swiperContainer.hasClass('tyyppi-p')) {
                determinedType = 'family';
              }
              // Add more conditions if there are other 'tyyppi-*' classes
            } else {
              // Fallback or alternative: check preceding H3 if .swiper-container isn't reliable for type
              // This is the method from the previous answer
              const $typeOuterContainer = $apartmentCard.closest('.swiper-container__outer');
              if ($typeOuterContainer.length) {
                  const $typeHeading = $typeOuterContainer.prev('h3');
                  if ($typeHeading.length) {
                      const headingText = $typeHeading.text().trim().toLowerCase();
                      if (headingText.includes('shared')) {
                          determinedType = 'shared';
                      } else if (headingText.includes('studio')) {
                          determinedType = 'studio';
                      } else if (headingText.includes('family')) {
                          determinedType = 'family';
                      }
                  }
              }
            }
          }

          // 3. Check if the determined type matches the filter (or if filter is 'all')
          if (apartmentTypeFilter === 'all' || apartmentTypeFilter === determinedType) {
            const apartmentUrl = $anchor.attr('href');
            if (apartmentUrl) { // Ensure URL is found
                vacantApartmentPropertiesUrl.push({
                  location: location.locName,
                  url: apartmentUrl,
                  apartmentType: determinedType, // Use the determined type
                  slug: extractSpecificSlug(apartmentUrl), // Make sure extractSpecificSlug is defined
                });
            }
          }
        }
      });

    } catch (error) {
      console.error(`Failed to fetch data from ${url}:`, error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        // console.error("Response data:", error.response.data); // careful with logging large data
      }
    }
  }

  console.log("Collected vacant apartment URLs:", vacantApartmentPropertiesUrl);
  return vacantApartmentPropertiesUrl;
};

// const getApartmentPropertiesUrl = async (locations, apartmentType='all') => { // this one gives you the url for the different vacant aprtments where you can then go to extract the props
//   const vacantApartmentPropertiesUrl = [];

//   for (const location of locations) {
//     const url = location.locUrl;

//     // Add a delay (throttling) between requests
//     await new Promise((resolve) => setTimeout(resolve, 1000)); // 2-second delay

//     try {
//       const { data } = await axios.get(url, {
//         headers: {
//           "User-Agent": "Mozilla/5.0 ",
//         },
//       });

//       const $ = cheerio.load(data);
//       const sharedClass = ".tyyppi-k";
//       const studioClass = ".tyyppi-y";
//       const familyClass = ".tyyppi-p";
      

//       $(".card-huoneisto__nappulat a").each((index, element) => {
//         const parentElement =element.parent.attribs.class;

//         if ($(element).text().trim() === "Vacant") {
//           // assign temporal id to parent element
//           $(`.${parentElement}`).attr('id', 'parentElement');

//           if ($(sharedClass).find("#parentElement").length > 0) {
//             apartmentType = "shared";
//           } else if ($(studioClass).find("#parentElement").length > 0) {
//             apartmentType = "studio";
//           } else if ($(familyClass).find("#parentElement").length > 0) {
//             apartmentType = "family";
//           }

//           vacantApartmentPropertiesUrl.push({
//             location: location.locName,
//             url: element.attribs.href,
//             apartmentType: apartmentType,
//             slug: extractSpecificSlug(element.attribs.href),
//           });
//         }
//       });

//     } catch (error) {
//       console.error(`Failed to fetch data from ${url}:`, error.message);
//     }
//   }

//   console.log("Vacant apartment properties URL:", vacantApartmentPropertiesUrl);

//   return vacantApartmentPropertiesUrl;
// };

const getLinkToVacantAppartmentProperties = async (apartmentType = "all") => {
  const locationNamesAndUrls = await getLocationsNameAndUrl();
  const displayedVacantApartments = await getDisplayedVacantApartments(
    apartmentType
  );
  const limit = pLimit(5); // Adjust concurrency limit as needed

  const linksToVacantApartmentProperties = [];

  const tasks = locationNamesAndUrls.map((location) =>
    limit(async () => {
      const locationSlug = extractLocation(location.locUrl);
      for (const vacantApartment of displayedVacantApartments) {
        if (vacantApartment === locationSlug) {
          const apartmentLocObject = {
            location: location.locName,
            url: location.locUrl,
          };
          return getApartmentPropertiesUrl(apartmentLocObject, apartmentType);
        }
      }
    })
  );

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      linksToVacantApartmentProperties.push(result.value);
    }
  }

  console.log(
    "Links to vacant apartment properties:",
    linksToVacantApartmentProperties
  );
  return linksToVacantApartmentProperties;
};

export { 
  getLinkToVacantAppartmentProperties,
  getLocationsNameAndUrl,
  getApartmentPropertiesUrl,
  extractApartmentDetails,
  getDisplayedVacantApartments
};

// Example usage
// async function main() {
//   const locations = [{
//     locName: "sellukatu",
//     locUrl: "https://www.psoas.fi/en/locations/sellukatu-6/",
//   }]
//   await getApartmentPropertiesUrl(locations);
// }

// main();
